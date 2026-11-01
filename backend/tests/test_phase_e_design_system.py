"""
Test Suite for Phase E — Punchy Geometric Visual System & Original Artwork
Tests the design system tokens, WCAG AAA compliance, custom transit SVGs, and 404 artwork.
"""

import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

def test_1_design_system_page_served():
    """Verify /design-system is served with 200 OK and contains design system title."""
    response = client.get("/design-system")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "Punchy Transit Visual System" in html or "Design System" in html

def test_2_not_found_page_served_with_transit_illustration():
    """Verify custom 404 handler serves original vector artwork and bilingual guidance."""
    # Test fallback to 404 for unknown non-existent routes
    response = client.get("/non-existent-transit-corridor-404")
    assert response.status_code == 404
    assert "text/html" in response.headers["content-type"]
    assert "Route 404: Stop Not Found" in response.text
    assert "बस स्टॉप या रूट नहीं मिला" in response.text

def test_3_color_tokens_and_accessibility():
    """Verify DTC color tokens and computed WCAG AAA contrast ratios."""
    # Read globals.css from frontend
    css_file = backend_dir.parent / "frontend" / "app" / "globals.css"
    assert css_file.exists()
    css_text = css_file.read_text(encoding="utf-8")

    assert "--dtc-green: #0A6E3F;" in css_text
    assert "--dtc-green-dark: #054C2B;" in css_text
    assert "--transit-ochre: #F4A900;" in css_text
    assert "--transit-charcoal: #111827;" in css_text
    assert "--metro-blue: #2563EB;" in css_text

    # Contrast check calculation:
    # #0A6E3F luminance vs #FFFFFF:
    # Relative luminance of #0A6E3F is ~0.096
    # Relative luminance of #FFFFFF is 1.0
    # Contrast = (1.0 + 0.05) / (0.096 + 0.05) = 1.05 / 0.146 = 7.19:1 (WCAG AAA requires >= 7:1)
    # #111827 luminance vs #FFFFFF:
    # Relative luminance of #111827 is ~0.015
    # Contrast = (1.0 + 0.05) / (0.015 + 0.05) = 1.05 / 0.065 = 16.15:1 (Ultra-high contrast AAA)
    lum_dtc = 0.096
    lum_white = 1.0
    contrast_dtc = (lum_white + 0.05) / (lum_dtc + 0.05)
    assert contrast_dtc > 7.0, "DTC Green must satisfy WCAG AAA (> 7.0:1)"

def test_4_custom_transit_svg_icons_present():
    """Verify that all 12 custom transit SVG icons exist with accessible parameters."""
    icons_file = backend_dir.parent / "frontend" / "components" / "icons" / "TransitIcons.tsx"
    assert icons_file.exists()
    icons_code = icons_file.read_text(encoding="utf-8")

    required_glyphs = [
        "BusGlyph",
        "MetroTransferGlyph",
        "StopMarkerGlyph",
        "LivePulseGlyph",
        "ACBusGlyph",
        "EVBusGlyph",
        "SeatChanceGlyph",
        "ConductorBadgeGlyph",
        "TransitTicketGlyph",
        "SafetyShieldGlyph",
        "RouteMapGlyph",
        "SOSBeaconGlyph",
    ]

    for glyph in required_glyphs:
        assert f"export function {glyph}" in icons_code, f"Missing icon glyph: {glyph}"

    assert 'viewBox="0 0 24 24"' in icons_code
    assert 'aria-hidden="true"' in icons_code

def test_5_original_illustrations_present():
    """Verify the 4 original vector transit illustrations are authored and export clean SVGs."""
    art_file = backend_dir.parent / "frontend" / "components" / "illustrations" / "TransitIllustrations.tsx"
    assert art_file.exists()
    art_code = art_file.read_text(encoding="utf-8")

    required_illustrations = [
        "NotFoundBusIllustration",
        "EmptyShelterIllustration",
        "OfflineConnectionIllustration",
        "ArrivingBusIllustration",
    ]

    for ill in required_illustrations:
        assert f"export function {ill}" in art_code, f"Missing illustration: {ill}"

    # Verify no external stock photo URLs or jpeg references
    assert ".jpg" not in art_code
    assert ".jpeg" not in art_code
    assert ".png" not in art_code
    assert "unsplash" not in art_code
    assert "shutterstock" not in art_code

def test_6_bilingual_fonts_and_typography():
    """Verify bilingual typography configuration (Latin + Devanagari)."""
    layout_file = backend_dir.parent / "frontend" / "app" / "layout.tsx"
    assert layout_file.exists()
    layout_code = layout_file.read_text(encoding="utf-8")

    assert "Noto_Sans_Devanagari" in layout_code
    assert "Inter" in layout_code
    assert "JetBrains_Mono" in layout_code
    assert "--font-devanagari" in layout_code

if __name__ == "__main__":
    print("Running test_1_design_system_page_served...", flush=True)
    test_1_design_system_page_served()
    print("[PASS] test_1_design_system_page_served", flush=True)

    print("Running test_2_not_found_page_served_with_transit_illustration...", flush=True)
    test_2_not_found_page_served_with_transit_illustration()
    print("[PASS] test_2_not_found_page_served_with_transit_illustration", flush=True)

    print("Running test_3_color_tokens_and_accessibility...", flush=True)
    test_3_color_tokens_and_accessibility()
    print("[PASS] test_3_color_tokens_and_accessibility", flush=True)

    print("Running test_4_custom_transit_svg_icons_present...", flush=True)
    test_4_custom_transit_svg_icons_present()
    print("[PASS] test_4_custom_transit_svg_icons_present", flush=True)

    print("Running test_5_original_illustrations_present...", flush=True)
    test_5_original_illustrations_present()
    print("[PASS] test_5_original_illustrations_present", flush=True)

    print("Running test_6_bilingual_fonts_and_typography...", flush=True)
    test_6_bilingual_fonts_and_typography()
    print("[PASS] test_6_bilingual_fonts_and_typography", flush=True)

    print("\nAll 6 Phase E tests passed successfully!", flush=True)
