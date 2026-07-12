import { NextResponse } from "next/server";

// TODO: no weather API key is configured in this environment. Wire a real
// provider (e.g. National Weather Service api.weather.gov, which is free
// and keyless, or OpenWeather with an API key) and geo-IP the request.
// Returning a plausible Hampton Roads seasonal placeholder for now.
export async function GET() {
  return NextResponse.json({
    tempF: 84,
    description: "Partly cloudy",
    hi: 89,
    lo: 74,
  });
}
