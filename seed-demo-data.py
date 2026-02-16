#!/usr/bin/env python3
import urllib.request
import json
import uuid
import sys

API = "http://localhost:5100/api"

def post(path, data):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print("  ERROR {}: {}".format(e.code, body[:200]))
        return None

def get(path):
    with urllib.request.urlopen(API + path) as resp:
        return json.loads(resp.read())

def delete(path):
    req = urllib.request.Request(API + path, method="DELETE")
    try:
        urllib.request.urlopen(req)
        return True
    except:
        return False

# Clean existing data
print("=== Cleaning existing data ===")
try:
    existing = get("/patients")
    for p in existing:
        pid = p.get("id")
        if pid:
            delete("/patients/" + pid)
            print("  Deleted patient " + pid)
except:
    pass

try:
    existing = get("/appointments")
    for a in existing:
        aid = a.get("_id") or a.get("id")
        if aid:
            delete("/appointments/" + aid)
            print("  Deleted appointment " + aid)
except:
    pass

try:
    existing = get("/invoices")
    for inv in existing:
        iid = inv.get("id")
        if iid:
            delete("/invoices/" + iid)
            print("  Deleted invoice " + iid)
except:
    pass

print("\n=== Seeding 10 Patients ===")
patients_data = [
    {"firstName": "Sarah", "lastName": "Johnson", "email": "sarah.johnson@email.com", "dateOfBirth": "1985-03-15", "phoneNumber": "+1-555-0101", "address": "123 Oak Street, Boston, MA 02108"},
    {"firstName": "Michael", "lastName": "Chen", "email": "michael.chen@email.com", "dateOfBirth": "1990-07-22", "phoneNumber": "+1-555-0102", "address": "456 Maple Ave, San Francisco, CA 94102"},
    {"firstName": "Emily", "lastName": "Williams", "email": "emily.williams@email.com", "dateOfBirth": "1978-11-08", "phoneNumber": "+1-555-0103", "address": "789 Pine Road, Chicago, IL 60601"},
    {"firstName": "James", "lastName": "Rodriguez", "email": "james.rodriguez@email.com", "dateOfBirth": "1995-01-30", "phoneNumber": "+1-555-0104", "address": "321 Elm Boulevard, Miami, FL 33101"},
    {"firstName": "Olivia", "lastName": "Brown", "email": "olivia.brown@email.com", "dateOfBirth": "1988-06-12", "phoneNumber": "+1-555-0105", "address": "654 Cedar Lane, Seattle, WA 98101"},
    {"firstName": "David", "lastName": "Kim", "email": "david.kim@email.com", "dateOfBirth": "1972-09-25", "phoneNumber": "+1-555-0106", "address": "987 Birch Drive, Austin, TX 73301"},
    {"firstName": "Sophia", "lastName": "Martinez", "email": "sophia.martinez@email.com", "dateOfBirth": "1993-04-18", "phoneNumber": "+1-555-0107", "address": "246 Walnut Court, Denver, CO 80201"},
    {"firstName": "Robert", "lastName": "Taylor", "email": "robert.taylor@email.com", "dateOfBirth": "1967-12-03", "phoneNumber": "+1-555-0108", "address": "135 Spruce Way, Portland, OR 97201"},
    {"firstName": "Isabella", "lastName": "Lee", "email": "isabella.lee@email.com", "dateOfBirth": "1999-08-20", "phoneNumber": "+1-555-0109", "address": "864 Ash Street, New York, NY 10001"},
    {"firstName": "William", "lastName": "Anderson", "email": "william.anderson@email.com", "dateOfBirth": "1982-02-14", "phoneNumber": "+1-555-0110", "address": "753 Hickory Place, Atlanta, GA 30301"},
]

patient_ids = []
for p in patients_data:
    resp = post("/patients", p)
    if resp and "id" in resp:
        patient_ids.append(resp["id"])
        print("  Created: {} {} ({})".format(p["firstName"], p["lastName"], resp["id"]))
    else:
        print("  FAILED: {} {}".format(p["firstName"], p["lastName"]))

print("\nCreated {} patients".format(len(patient_ids)))

print("\n=== Seeding 10 Appointments ===")
doctors = ["Dr. Smith", "Dr. Patel", "Dr. Wilson", "Dr. Garcia", "Dr. Thompson"]
reasons = ["Annual checkup", "Follow-up visit", "Blood work review", "Vaccination", "Chest pain evaluation",
           "Skin rash consultation", "Back pain assessment", "Allergy testing", "Diabetes management", "Blood pressure review"]

appt_ids = []
for i, pid in enumerate(patient_ids):
    p = patients_data[i]
    month = 1 + i // 4
    day = i * 3 + 1
    appt = {
        "patientId": pid,
        "patientName": p["firstName"] + " " + p["lastName"],
        "patientEmail": p["email"],
        "doctorName": doctors[i % 5],
        "appointmentDate": "2026-0{}-{:02d}T10:00:00Z".format(month, day),
        "duration": 30 + (i % 3) * 15,
        "reason": reasons[i],
    }
    resp = post("/appointments", appt)
    if resp:
        aid = resp.get("_id") or resp.get("id")
        if aid:
            appt_ids.append(aid)
            print("  Created: {} with {} ({})".format(p["firstName"], doctors[i % 5], aid))
        else:
            print("  WARN: no id in response")
    else:
        print("  FAILED: appointment for {}".format(p["firstName"]))

print("\nCreated {} appointments".format(len(appt_ids)))

print("\n=== Seeding 10 Invoices ===")
descriptions = ["Annual physical examination", "Lab work - Complete blood panel", "X-Ray imaging",
                "Specialist consultation", "Vaccination administration", "Physical therapy session",
                "Dermatology consultation", "MRI scan", "Allergy testing panel", "Cardiovascular screening"]
amounts = [150.00, 275.00, 350.00, 200.00, 85.00, 175.00, 225.00, 950.00, 320.00, 450.00]

invoice_ids = []
count = min(len(patient_ids), len(appt_ids))
for i in range(count):
    p = patients_data[i]
    inv = {
        "patientId": patient_ids[i],
        "appointmentId": str(uuid.uuid4()),
        "patientName": p["firstName"] + " " + p["lastName"],
        "patientEmail": p["email"],
        "amount": amounts[i],
        "description": descriptions[i],
    }
    resp = post("/invoices", inv)
    if resp and "id" in resp:
        invoice_ids.append(resp["id"])
        print("  Created: {} - ${} ({})".format(descriptions[i], amounts[i], resp["id"]))
    else:
        print("  FAILED: invoice for {}".format(p["firstName"]))

print("\nCreated {} invoices".format(len(invoice_ids)))

print("\n=== Marking 5 invoices as paid ===")
for i in [0, 2, 4, 6, 8]:
    if i < len(invoice_ids):
        iid = invoice_ids[i]
        resp = post("/invoices/" + iid + "/pay", {})
        if resp:
            print("  Paid: " + iid)
        else:
            print("  FAILED to pay: " + iid)

print("\n=== Verification ===")
patients = get("/patients")
appts = get("/appointments")
invoices = get("/invoices")
notifs = get("/notifications")
print("Patients: {}".format(len(patients)))
print("Appointments: {}".format(len(appts)))
print("Invoices: {}".format(len(invoices)))
print("Notifications: {}".format(len(notifs)))
print("\nDone!")
