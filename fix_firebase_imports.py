import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

target = "getDoc, onSnapshot } from 'firebase/firestore';"
replacement = "getDoc, onSnapshot, collection, getDocs, query, orderBy, deleteDoc, limit } from 'firebase/firestore';"

if "collection" not in target and "collection" not in content.splitlines()[2]:
    content = content.replace(target, replacement)

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)

print("Success")
