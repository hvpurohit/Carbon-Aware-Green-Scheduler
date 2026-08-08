import zipfile
import xml.etree.ElementTree as ET

try:
    with zipfile.ZipFile('Internship_Project_Report.docx') as docx:
        content = docx.read('word/document.xml')
        
    tree = ET.fromstring(content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for paragraph in tree.iterfind('.//w:p', ns):
        texts = [node.text for node in paragraph.iterfind('.//w:t', ns) if node.text]
        paragraphs.append(''.join(texts))
        
    with open('scratch/internship_report_text.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(paragraphs))
    print("Extraction successful. Total paragraphs:", len(paragraphs))
except Exception as e:
    print(f"Error: {e}")
