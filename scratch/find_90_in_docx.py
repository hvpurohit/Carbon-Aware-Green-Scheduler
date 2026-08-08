import zipfile
import xml.etree.ElementTree as ET
import glob
import os

files = glob.glob("*.docx")
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

for f_path in files:
    try:
        with zipfile.ZipFile(f_path) as docx:
            content = docx.read('word/document.xml')
        tree = ET.fromstring(content)
        
        paragraphs = []
        for paragraph in tree.iterfind('.//w:p', ns):
            texts = [node.text for node in paragraph.iterfind('.//w:t', ns) if node.text]
            paragraphs.append(''.join(texts))
            
        print(f"--- File: {f_path} ---")
        for i, p in enumerate(paragraphs):
            p_lower = p.lower()
            if "90" in p_lower:
                print(f"  P {i}: {p}")
            if "ninety" in p_lower:
                print(f"  P {i} (ninety): {p}")
    except Exception as e:
        print(f"Error reading {f_path}: {e}")
