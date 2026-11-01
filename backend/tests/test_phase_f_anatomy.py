"""
Test Suite for Phase F — Anatomy Animation: The Moving Bus (/anatomy)
Tests the interactive engineering cross-section, AIS-140 telematics,
sensor hotspots, bilingual labels, and /services directory integration.
"""

import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

def test_1_anatomy_page_served():
    """Verify /anatomy route returns 200 OK and serves the interactive bus anatomy page."""
    response = client.get("/anatomy")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    html = response.text
    assert "Anatomy of a Smart Transit Bus" in html or "DTC Low-Floor EV" in html
    assert "AIS-140" in html

def test_2_subsystems_definition_and_completeness():
    """Verify all 8 transit engineering subsystems are authored with coordinates and technical specs."""
    anatomy_file = backend_dir.parent / "frontend" / "app" / "anatomy" / "page.tsx"
    assert anatomy_file.exists(), "frontend/app/anatomy/page.tsx must exist"
    code = anatomy_file.read_text(encoding="utf-8")

    expected_subsystems = [
        ("ais140", "AIS-140 GPS & Telematics Transponder"),
        ("sos_buttons", "Passenger Panic SOS Buttons"),
        ("cctv_ai", "High-Definition AI CCTV Surveillance"),
        ("etm_validator", "Electronic Ticketing & NCMC Validator"),
        ("battery_pack", "250 kWh LFP Traction Battery Pack"),
        ("electric_motor", "Permanent Magnet Synchronous Motor"),
        ("passenger_counter", "Automated Passenger Flow Sensors"),
        ("low_floor_ramp", "400mm Low Floor & Pneumatic Kneeling Ramp"),
    ]

    for sub_id, name in expected_subsystems:
        assert f'id: "{sub_id}"' in code, f"Missing subsystem ID: {sub_id}"
        assert name in code, f"Missing subsystem title: {name}"

def test_3_bilingual_engineering_specifications():
    """Verify Hindi (Devanagari) labels and AIS compliance standards."""
    anatomy_file = backend_dir.parent / "frontend" / "app" / "anatomy" / "page.tsx"
    code = anatomy_file.read_text(encoding="utf-8")

    expected_hindi_terms = [
        "एआईएस-140 जीपीएस टेलीमैटिक्स यूनिट",
        "आपातकालीन पैनिक बटन नेटवर्क",
        "सीसीटीवी एआई सुरक्षा कैमरे",
        "इलेक्ट्रॉनिक टिकटिंग मशीन",
        "२५० किलोवाट लिथियम-आयन ट्रैक्शन बैटरी",
        "इलेक्ट्रिक मोटर और रीजेनेरेटिव ब्रेक",
        "स्वचालित यात्री भार और भीड़ सेंसर",
        "लो-फ्लोर व्हीलचेयर रैंप और सस्पेंशन",
    ]

    for term in expected_hindi_terms:
        assert term in code, f"Missing bilingual Hindi label: {term}"

    # Verify regulatory standards referenced
    assert "AIS-140" in code
    assert "Nirbhaya" in code
    assert "RPwD" in code

def test_4_services_directory_link_inclusion():
    """Verify /v1/services API includes the /anatomy page link."""
    response = client.get("/api/v1/services")
    assert response.status_code == 200
    data = response.json()
    all_links = [
        item.get("link")
        for section in data
        for item in section.get("services", [])
        if item.get("link")
    ]
    assert "/anatomy" in all_links, f"Expected /anatomy in services links: {all_links}"

def test_5_animation_controls_and_svg_structure():
    """Verify animation controls (play/pause, speed modes, cutaway vs exterior) and SVG elements."""
    anatomy_file = backend_dir.parent / "frontend" / "app" / "anatomy" / "page.tsx"
    code = anatomy_file.read_text(encoding="utf-8")

    assert "setIsPlaying" in code
    assert "setSpeedMode" in code
    assert "setViewMode" in code
    assert "requestAnimationFrame" in code
    assert 'viewBox="0 0 880 320"' in code
    assert "rotate(" in code
    assert "strokeDashoffset" in code

if __name__ == "__main__":
    print("Running test_1_anatomy_page_served...", flush=True)
    test_1_anatomy_page_served()
    print("[PASS] test_1_anatomy_page_served", flush=True)

    print("Running test_2_subsystems_definition_and_completeness...", flush=True)
    test_2_subsystems_definition_and_completeness()
    print("[PASS] test_2_subsystems_definition_and_completeness", flush=True)

    print("Running test_3_bilingual_engineering_specifications...", flush=True)
    test_3_bilingual_engineering_specifications()
    print("[PASS] test_3_bilingual_engineering_specifications", flush=True)

    print("Running test_4_services_directory_link_inclusion...", flush=True)
    test_4_services_directory_link_inclusion()
    print("[PASS] test_4_services_directory_link_inclusion", flush=True)

    print("Running test_5_animation_controls_and_svg_structure...", flush=True)
    test_5_animation_controls_and_svg_structure()
    print("[PASS] test_5_animation_controls_and_svg_structure", flush=True)

    print("\nAll 5 Phase F tests passed successfully!", flush=True)
