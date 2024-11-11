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

    for document in firestore.collection("grades").get():
        semester = document.reference.path.removeprefix("grades/")
        semester_json = json.loads(
            gzip.decompress(base64.b64decode(document.to_dict()["data"]))
        )
        for course_id in semester_json.keys():
            if course_id not in grades:
                print(f"Adding {course_id} for {semester}")
                grades[course_id] = {semester: semester_json[course_id]}
            elif semester not in grades[course_id]:
                print(f"Adding {course_id} for {semester}")
                grades[course_id][semester] = semester_json[course_id]

    for course_id in grades.keys():
        for semester in grades[course_id].keys():
            for values in grades[course_id][semester].values():
                for value in values:
                    if "average" in value:
                        value["mean"] = value.pop("average")

    with open("grades.json", "w") as f:
        json.dump(grades, f)
