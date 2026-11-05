import { NextResponse } from "next/server";
import OpenAI from "openai";
import { localeMeta } from "@/i18n/config";
import { resolveLocale } from "@/i18n/request";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Typical days from planting/transplanting to FIRST harvest in Indonesia. Anchors the model,
// which on its own drifted badly (e.g. 270 days for bird's eye chili).
const REFERENCE = `Reference ranges (days to first harvest, Indonesia):
rice/padi 100-125 (early varieties 90-105); corn/jagung 85-110 (sweet corn 65-75);
red chili/cabai merah 75-90 after transplanting; bird's eye chili/cabai rawit 80-100;
tomato/tomat 60-75; shallot/bawang merah 55-70; soybean/kedelai 75-90; peanut/kacang tanah 90-110;
eggplant/terong 60-75; cucumber/mentimun 35-45; water spinach/kangkung 25-30; mustard greens/sawi 30-40;
watermelon/semangka 65-80; cassava/singkong 240-300; potato/kentang 90-110; carrot/wortel 90-100.`;

/**
 * Estimates how many days after planting a crop is usually harvested (Indonesian tropical
 * lowland/upland conditions). Text only and short, so it costs very little per call.
 * POST { crop: string, plantedOn: "YYYY-MM-DD" } -> { days: number, note: string }
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "notConfigured" }, { status: 500 });
  const body = await request.json().catch(() => null);
  const crop = String(body?.crop ?? "").trim().slice(0, 60);
  const plantedOn = String(body?.plantedOn ?? "");
  if (!crop || !/^\d{4}-\d{2}-\d{2}$/.test(plantedOn)) return NextResponse.json({ error: "badRequest" }, { status: 400 });

  const language = localeMeta[await resolveLocale()].aiName;
  try {
    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an agronomist for Indonesian farmers. Given a crop and its planting date, estimate the typical " +
            "number of days from planting (or transplanting/sowing as farmers usually count it) to the FIRST harvest " +
            "in Indonesia. For crops picked repeatedly (chili, tomato, eggplant), count to the first picking. " +
            "Use the middle of the reference range when the crop is listed. The list is only a sample: for any other " +
            "plant (e.g. green beans, durian, papaya) estimate from general agronomic knowledge and never return 0 for a real plant. " +
            `${REFERENCE}\nReply as JSON: ` +
            `{"days": integer between 1 and 365, "note": one short sentence in ${language} giving the usual range ` +
            "and what makes it earlier or later (variety, season)}. If the crop usually takes longer than a year, " +
            "use 365 and say so in the note. Use days 0 only if the input is clearly not a plant at all (e.g. a car).",
        },
        { role: "user", content: `Crop: ${crop}\nPlanting date: ${plantedOn}` },
      ],
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    const days = Math.round(Number(parsed.days));
    if (!Number.isFinite(days) || days < 1) return NextResponse.json({ error: "badRequest" }, { status: 422 });
    return NextResponse.json({ days: Math.min(days, 365), note: String(parsed.note ?? "").slice(0, 500) });
  } catch (err) {
    console.error("Harvest estimate failed", err);
    return NextResponse.json({ error: "aiFailed" }, { status: 502 });
  }
}
