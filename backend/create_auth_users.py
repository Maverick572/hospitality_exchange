import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from firebase_admin import auth
import core.firebase

ACCOUNTS = [
    # ── 5 Vendors (Providers) ──
    {
        "uid": "usr_taj_lands_end",
        "email": "ops@tajlandsend.demo",
        "fallback_email": "ops@tajlandsend.com",
        "password": "Password@123",
        "name": "Taj Lands End",
        "role": "vendor",
        "location": "Bandra West, Mumbai",
    },
    {
        "uid": "usr_itc_maratha",
        "email": "banquets@itcmaratha.demo",
        "fallback_email": "banquets@itcmaratha.com",
        "password": "Password@123",
        "name": "ITC Maratha Mumbai",
        "role": "vendor",
        "location": "Andheri East, Mumbai",
    },
    {
        "uid": "usr_trident_bkc",
        "email": "events@tridentbkc.demo",
        "fallback_email": "events@tridentbkc.com",
        "password": "Password@123",
        "name": "Trident Hotel BKC",
        "role": "vendor",
        "location": "Bandra Kurla Complex, Mumbai",
    },
    {
        "uid": "usr_renaissance_powai",
        "email": "fnb@renaissancepowai.demo",
        "fallback_email": "fnb@renaissancepowai.com",
        "password": "Password@123",
        "name": "Renaissance Mumbai Convention Centre",
        "role": "vendor",
        "location": "Powai, Mumbai",
    },
    {
        "uid": "usr_sahara_star",
        "email": "procurement@saharastar.demo",
        "fallback_email": "procurement@saharastar.com",
        "password": "Password@123",
        "name": "Hotel Sahara Star",
        "role": "vendor",
        "location": "Vile Parle East, Mumbai",
    },

    # ── 5 Buyers (Seekers) ──
    {
        "uid": "usr_jio_convention",
        "email": "events@jioconvention.demo",
        "fallback_email": "events@jioconvention.com",
        "password": "Password@123",
        "name": "Jio World Convention Centre",
        "role": "buyer",
        "location": "Bandra Kurla Complex, Mumbai",
    },
    {
        "uid": "usr_bombay_gymkhana",
        "email": "secretary@bombaygymkhana.demo",
        "fallback_email": "secretary@bombaygymkhana.com",
        "password": "Password@123",
        "name": "Bombay Gymkhana Club",
        "role": "buyer",
        "location": "Fort, Mumbai",
    },
    {
        "uid": "usr_nesco_goregaon",
        "email": "admin@nesco.demo",
        "fallback_email": "admin@nesco.com",
        "password": "Password@123",
        "name": "NESCO Exhibition Centre",
        "role": "buyer",
        "location": "Goregaon East, Mumbai",
    },
    {
        "uid": "usr_taj_colaba",
        "email": "concierge@tajpalace.demo",
        "fallback_email": "concierge@tajpalace.com",
        "password": "Password@123",
        "name": "The Taj Mahal Palace",
        "role": "buyer",
        "location": "Colaba, Mumbai",
    },
    {
        "uid": "usr_blue_sea_worli",
        "email": "banquets@bluesea.demo",
        "fallback_email": "banquets@bluesea.com",
        "password": "Password@123",
        "name": "Blue Sea Banquets Worli",
        "role": "buyer",
        "location": "Worli, Mumbai",
    },

    # ── 8 Logistics Drivers (Realistic Mumbai Fleet) ──
    {
        "uid": "drv_amit_deshmukh",
        "email": "amit.tempo@demo.com",
        "fallback_email": "amit.tempo@gmail.com",
        "password": "Password@123",
        "name": "Amit Deshmukh (Piaggio Ape 3W)",
        "role": "driver",
        "location": "Bandra - Kurla - Panvel Corridor",
    },
    {
        "uid": "drv_sunil_yadav",
        "email": "sunil.transport@demo.com",
        "fallback_email": "sunil.transport@gmail.com",
        "password": "Password@123",
        "name": "Sunil Yadav (Mahindra Bolero Maxi)",
        "role": "driver",
        "location": "Western Suburbs (Andheri - BKC)",
    },
    {
        "uid": "drv_ramesh_pawar",
        "email": "ramesh.logistics@demo.com",
        "fallback_email": "ramesh.logistics@gmail.com",
        "password": "Password@123",
        "name": "Ramesh Pawar (Tata Ace Gold)",
        "role": "driver",
        "location": "Mumbai Spine (BKC - Colaba)",
    },
    {
        "uid": "drv_ganesh_shinde",
        "email": "ganesh.shinde@demo.com",
        "fallback_email": "ganesh.shinde@gmail.com",
        "password": "Password@123",
        "name": "Ganesh Shinde (Tata 407 SFC LCV)",
        "role": "driver",
        "location": "Goregaon - Bandra - Fort Corridor",
    },
    {
        "uid": "drv_mohammad_rafiq",
        "email": "rafiq.logistics@demo.com",
        "fallback_email": "rafiq.logistics@gmail.com",
        "password": "Password@123",
        "name": "Mohammad Rafiq (Mahindra Bolero City)",
        "role": "driver",
        "location": "Powai - BKC - Worli Corridor",
    },
    {
        "uid": "drv_sanjay_varma",
        "email": "sanjay.varma@demo.com",
        "fallback_email": "sanjay.varma@gmail.com",
        "password": "Password@123",
        "name": "Sanjay Varma (Tata Ace EV)",
        "role": "driver",
        "location": "Dadar - Churchgate - Colaba Corridor",
    },
    {
        "uid": "drv_pradeep_patil",
        "email": "pradeep.transport@demo.com",
        "fallback_email": "pradeep.transport@gmail.com",
        "password": "Password@123",
        "name": "Pradeep Patil (Ashok Leyland Bada Dost)",
        "role": "driver",
        "location": "Thane - Ghatkopar - BKC Corridor",
    },
    {
        "uid": "drv_vikram_salvi",
        "email": "vikram.salvi@demo.com",
        "fallback_email": "vikram.salvi@gmail.com",
        "password": "Password@123",
        "name": "Vikram Salvi (Eicher Pro 2049)",
        "role": "driver",
        "location": "Borivali - Malad - Bandra Corridor",
    },
]

def main():
    print("=" * 60)
    print("CREATING / UPDATING FIREBASE AUTH ACCOUNTS")
    print("=" * 60)

    results = []

    for acc in ACCOUNTS:
        uid = acc["uid"]
        email = acc["email"]
        password = acc["password"]
        name = acc["name"]

        try:
            # Try to get existing user by UID
            try:
                user = auth.get_user(uid)
                auth.update_user(uid, email=email, password=password, display_name=name)
                print(f"[UPDATED] {uid} -> {email}")
                results.append((name, email, password, acc["role"], acc["location"]))
                continue
            except auth.UserNotFoundError:
                pass

            # Try to create new user
            try:
                auth.create_user(uid=uid, email=email, password=password, display_name=name)
                print(f"[CREATED] {uid} -> {email}")
                results.append((name, email, password, acc["role"], acc["location"]))
            except Exception as e:
                # If .demo is rejected as invalid email, try fallback .com
                fb_email = acc["fallback_email"]
                print(f"Retrying with fallback email {fb_email} due to: {e}")
                auth.create_user(uid=uid, email=fb_email, password=password, display_name=name)
                print(f"[CREATED with fallback] {uid} -> {fb_email}")
                results.append((name, fb_email, password, acc["role"], acc["location"]))

        except Exception as e:
            print(f"[ERROR] {uid}: {e}")

    print("\nAll accounts processed.")

if __name__ == "__main__":
    main()
