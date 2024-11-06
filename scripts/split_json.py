import base64
import json
import gzip

import firebase_admin
import firebase_admin.firestore

if __name__ == "__main__":
    credential = firebase_admin.credentials.Certificate("credentials.json")
    app = firebase_admin.initialize_app(
        credential,
    )
    firestore = firebase_admin.firestore.client()

    with open("grades.json", "r") as f:
        grades = json.load(f)

    semesters = set()
    for grade_info in grades.values():
        for year in grade_info.keys():
            semesters.add(year)

    sizes = {}
    for semester in semesters:
        semester_json = {}
        for course_id, grade_info in grades.items():
            if semester in grade_info:
                semester_json[course_id] = grade_info[semester]

        compressed_semester_json = {
            "data": base64.b64encode(
                gzip.compress(json.dumps(semester_json).encode())
            ).decode()
        }
        semester_json_str = json.dumps(compressed_semester_json)
        sizes[semester] = len(semester_json_str)

        with open(f"grades-{semester}.json", "w") as f:
            f.write(semester_json_str)

        firestore.document(f"grades/{semester}").set(compressed_semester_json)

    for semester in sorted(sizes.keys(), key=lambda semester: sizes[semester]):
        print(f"Size for {semester}: {sizes[semester]}")
