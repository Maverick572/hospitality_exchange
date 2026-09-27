"""Analyzer and NLP synthesizer for scraped social media weather reports."""

import os
import json
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Severe weather & disruption keyword patterns
CRITICAL_KEYWORDS = [
    "flood", "flooding", "flash flood", "submerged", "inundated",
    "hurricane", "tornado", "cyclone", "typhoon", "landslide",
    "state of emergency", "evacuate", "evacuation", "red alert",
]

SEVERE_KEYWORDS = [
    "heavy rain", "downpour", "torrential", "waterlogging", "waterlogged",
    "severe storm", "thunderstorm", "hailstorm", "blizzard", "heatwave",
    "extreme heat", "gale", "power outage", "blackout", "roads blocked",
    "trees fallen", "traffic halted", "orange alert",
]

MODERATE_KEYWORDS = [
    "rain", "raining", "showers", "drizzle", "windy", "gusts",
    "chilly", "cold wave", "overcast", "cloudy", "yellow alert",
    "traffic slow", "fog", "smog", "humid",
]


def analyze_weather_reports(
    location: str,
    social_posts: List[Dict[str, Any]],
    telemetry: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Synthesize and analyze scraped social media posts alongside weather telemetry.

    Returns:
        Structured analysis containing:
        - severity_level: 'Normal', 'Moderate', 'Severe', or 'Critical'
        - disruption_detected: bool
        - detected_events: List of detected weather/infrastructure issues
        - summary: Text summary of situation on the ground
        - hospitality_recommendations: Logistics and relief suggestions
    """
    combined_text = " ".join(
        [f"{p.get('title', '')} {p.get('text', '')}" for p in social_posts]
    ).lower()

    if telemetry:
        combined_text += f" {telemetry.get('condition', '')} {telemetry.get('precipitation_mm', '')}".lower()

    detected_events = []
    severity = "Normal"

    # Check for Critical triggers
    for kw in CRITICAL_KEYWORDS:
        if kw in combined_text:
            detected_events.append(kw.title())
            severity = "Critical"

    # Check for Severe triggers
    for kw in SEVERE_KEYWORDS:
        if kw in combined_text:
            if kw.title() not in detected_events:
                detected_events.append(kw.title())
            if severity != "Critical":
                severity = "Severe"

    # Check for Moderate triggers
    for kw in MODERATE_KEYWORDS:
        if kw in combined_text:
            if kw.title() not in detected_events:
                detected_events.append(kw.title())
            if severity == "Normal":
                severity = "Moderate"

    disruption_detected = severity in ("Severe", "Critical")

    # Generate Hospitality Recommendations
    recommendations: List[str] = []
    if severity == "Critical":
        recommendations.append("Alert nearby shelter hosts and relief centres immediately.")
        recommendations.append("Suspend non-essential logistics delivery routes in affected zones.")
        recommendations.append("Prioritize emergency rations, potable water, and dry bedding.")
    elif severity == "Severe":
        recommendations.append("Warn delivery drivers about potential waterlogging and road slowdowns.")
        recommendations.append("Prepare emergency supply packages (rain gear, hot meals, blankets).")
        recommendations.append("Verify host venue availability in case seekers need temporary shelter.")
    elif severity == "Moderate":
        recommendations.append("Standard operations with driver advisory for wet roads/weather delays.")
        recommendations.append("Ensure hot meal and beverages availability for incoming seekers.")
    else:
        recommendations.append("Weather conditions normal. Standard hospitality resource routing active.")

    # Check if Groq is available for deep LLM synthesis
    groq_api_key = os.getenv("GROQ_API_KEY")
    summary = ""

    if groq_api_key and social_posts:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)

            post_samples = "\n".join(
                [f"- [{p.get('source')}] {p.get('title')}: {p.get('text', '')[:140]}" for p in social_posts[:6]]
            )

            prompt = (
                f"You are an assistant for a Hospitality and Disaster Relief Resource Exchange platform. "
                f"Analyze the following real-time scraped social media reports and weather data for {location}.\n\n"
                f"Telemetry: {json.dumps(telemetry) if telemetry else 'None'}\n\n"
                f"Social Media Posts:\n{post_samples}\n\n"
                f"Write a concise 2-3 sentence executive situation summary of the current weather and ground conditions in {location}."
            )

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.2,
            )
            summary = response.choices[0].message.content.strip()
        except Exception:
            summary = ""

    if not summary:
        # Rule-based fallback summary
        if telemetry:
            t_cond = telemetry.get("condition", "Current conditions")
            t_temp = telemetry.get("temp_c", "")
            summary = f"Weather in {location} is currently {t_cond} ({t_temp}). "
        else:
            summary = f"Scraped social media reports for {location}. "

        if detected_events:
            summary += f"Social media discussions indicate mentions of {', '.join(detected_events[:4])}. "
            if disruption_detected:
                summary += f"Local disruptions and {severity.lower()} weather impacts reported by community."
            else:
                summary += "No critical emergency alerts reported at this time."
        else:
            summary += f"Community feeds reflect standard weather patterns with no severe disruption reports."

    return {
        "severity_level": severity,
        "disruption_detected": disruption_detected,
        "detected_events": list(set(detected_events)),
        "summary": summary,
        "hospitality_recommendations": recommendations,
    }
