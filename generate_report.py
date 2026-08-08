from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
import datetime

# Create a new Document
doc = Document()

# Define styles
styles = doc.styles

# Body text style
style = styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
paragraph_format = style.paragraph_format
paragraph_format.line_spacing = 1.5
paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

# Title style
title_style = styles.add_style('ReportTitle', WD_STYLE_TYPE.PARAGRAPH)
title_font = title_style.font
title_font.name = 'Times New Roman'
title_font.size = Pt(16)
title_font.bold = True
title_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Subtitle / Heading style
heading_style = styles.add_style('ReportHeading', WD_STYLE_TYPE.PARAGRAPH)
heading_font = heading_style.font
heading_font.name = 'Times New Roman'
heading_font.size = Pt(14)
heading_font.bold = True

def add_title_page(doc):
    doc.add_paragraph('GREEN-SCHEDULER PIPELINE', style='ReportTitle')
    doc.add_paragraph('Industry Internship report submitted\nFor Review in fulfillment of\nThe requirement for the degree of\nBachelor of Technology\n(Computer Science and Engineering)', style='Normal')
    doc.add_paragraph('\nBy\nNidhi Zala - 16103458\n', style='Normal')
    doc.add_paragraph('Guided By:\nGuide: <Name of Industry Guide> (<Name of Organization>)\nCo-Guide: <Name of Co-Guide>', style='Normal')
    doc.add_paragraph('\nDepartment of Computer Science and Engineering\nSchool of Engineering and Technology\nNavrachana University, Vadodara\nMay 2026', style='Normal')
    doc.add_page_break()

def add_certificate(doc):
    doc.add_paragraph('CERTIFICATE', style='ReportTitle')
    cert_text = "This is to certify that the project report entitled \"Green-Scheduler Pipeline\" submitted by \"Nidhi Zala\" to School of Engineering and Technology (SET) of Navrachana University Vadodara, in partial fulfillment for the award of the degree of B. Tech in Computer Science and Engineering (CSE) department. This report is a bona fide record work that has been carried out under my supervision during academic year 2025-26. The contents of this report, in full or in parts, have not been submitted to any other Institution or University for the award of any degree or diploma."
    doc.add_paragraph(cert_text, style='Normal')
    doc.add_paragraph('\n\n\n_______________________\nGuide Signature', style='Normal')
    doc.add_page_break()

def add_acknowledgment(doc):
    doc.add_paragraph('ACKNOWLEDGMENT', style='ReportTitle')
    ack_text = "Every project big or small is successful largely due to the effort of a number of wonderful people who have always given their valuable advice or lent a helping hand. We sincerely appreciate the inspiration, support and guidance of all those people who have been instrumental in making this project a success.\n\nWe feel deeply honored in expressing our sincere thanks to our guides and faculty members for providing valuable insights leading to the successful completion of the Green-Scheduler Pipeline project."
    doc.add_paragraph(ack_text, style='Normal')
    doc.add_page_break()

def add_abstract(doc):
    doc.add_paragraph('ABSTRACT', style='ReportTitle')
    abstract_text = "The 'Green-scheduler' pipeline is an innovative DevOps and ML-Ops initiative that transforms Green Ops from a theoretical stance into a hard-coded, automated policy. Instead of running heavy batch jobs (e.g., ML training, large data processing) on a fixed schedule, this pipeline uses a Gatekeeper Pattern. It queries real-time grid carbon intensity and only permits execution when the environmental conditions (i.e., renewable energy availability) meet predefined thresholds. This approach heavily relies on the concept of 'Temporal Shifting'—delaying flexible workloads to periods when the power grid is greenest."
    p = doc.add_paragraph(abstract_text, style='Normal')
    # Abstract should be italic
    for run in p.runs:
        run.italic = True
    doc.add_page_break()

def add_toc(doc):
    doc.add_paragraph('TABLE OF CONTENTS', style='ReportTitle')
    doc.add_paragraph('1. Title Page ... 1\n2. Abstract ... 4\n3. Architecture ... 6\n4. Technology Stack ... 7\n5. Alternative Technologies ... 8\n6. Research Context ... 9\n7. Future Work ... 10\n8. References ... 11', style='Normal')
    doc.add_page_break()

def add_chapters(doc):
    # Chapter 1
    doc.add_paragraph('1. PROJECT OVERVIEW & ARCHITECTURE', style='ReportHeading')
    doc.add_paragraph('1.1 The Architectural Flow', style='ReportHeading')
    flow_text = """The pipeline functions through a clear 5-step sequence:
1. The Pulse (Cron Orchestrator): A CI/CD orchestrator wakes up on a predetermined cron schedule.
2. The Green Check: The orchestrator queries a Carbon Intensity API (e.g., ElectricityMaps, WattTime) to get the current greenhouse gas intensity (gCO2eq/kWh) for the target data center region.
3. The Decision Engine: Evaluates the intensity against a sustainability policy (e.g., threshold set at 50g/kWh for non-critical jobs, 250g/kWh for business-critical ones).
4. The Execution: If the grid is 'clean', the orchestrator triggers the remote job execution (e.g., an Argo Kubernetes workflow monitored by Kepler) on heavy-duty instances.
5. The Audit & Reporting: Upon completion, a script calculates the carbon avoided (vs. peak hours) and generates a verifiable Sustainability PDF Report."""
    doc.add_paragraph(flow_text, style='Normal')
    doc.add_page_break()

    # Chapter 2
    doc.add_paragraph('2. PRIMARY TECHNOLOGY STACK', style='ReportHeading')
    stack_text = """To implement this architecture, we utilize the following robust and widely-adopted tools:
- Data Source (Carbon API): 'Carbon Aware SDK' (Green Software Foundation) or APIs like 'ElectricityMaps' and 'WattTime'. They offer real-time grid carbon characteristics.
- Orchestration & Automation: 'GitHub Actions' or 'GitLab CI/CD'. These serve as the 'brain' without doing the heavy lifting, executing small HTTP requests to check APIs and trigger remote jobs.
- Compute Execution: Containerized workloads running on 'Kubernetes' clusters equipped with 'Kepler' for energy monitoring, triggered via CLI/SDKs.
- Policy Definition: Simple YAML files describing thresholds for different job priorities.
- Audit Reporting: Python libraries like 'ReportLab' or 'FPDF2' to generate automated PDF sustainability certificates with graphs showing grid profile at execution time."""
    doc.add_paragraph(stack_text, style='Normal')
    doc.add_page_break()

    # Chapter 3
    doc.add_paragraph('3. ALTERNATIVE TECHNOLOGIES', style='ReportHeading')
    alt_text = """If we prefer to deeply integrate this into our existing cloud-native infrastructure without relying purely on CI/CD orchestrators, the following alternatives can be used:
- Kubernetes Native Schedulers: Tools like 'KEDA' (Kubernetes Event-driven Autoscaling) coupled with Carbon-Aware scalers, or the 'Compute Gardener' open-source K8s scheduler. These allow pods to be scheduled natively based on real-time grid carbon/price data.
- HashiCorp Nomad: Nomad features a 'carbon branch' that explicitly scores nodes based on carbon intensity to influence placement for spatial shifting.
- Monitoring via eBPF: Project 'Kepler' (Kubernetes-based Efficient Power Level Exporter) can be used to precisely measure pod-level energy consumption and prove the carbon footprint reduction.
- Ready Resource: Python's 'carbon-aware-scheduler' package can natively wrap batch jobs purely through Python scripts without complex CI/CD."""
    doc.add_paragraph(alt_text, style='Normal')
    doc.add_page_break()

    # Chapter 4
    doc.add_paragraph('4. RESEARCH CONTEXT & FINOPS SYNERGY', style='ReportHeading')
    research_text = """Recent academic research strongly validates this project choice:
- Temporal vs. Spatial Shifting: Studies show 'temporal shifting' (running jobs later) can reduce emissions by up to ~20-30%, while 'spatial shifting' (running jobs in a different region, like Norway over Poland) can reduce emissions by up to 85% for FaaS or batch workloads.
- Carbon-Aware Scheduling: Using grid awareness is recognized as an industry best practice under the 'GreenOps' umbrella, pushing operations beyond abstract guidelines into actionable infrastructure as code.
- Financial Synergy: Low carbon intensity frequently correlates with high renewable energy supply, which lowers spot-instance pricing. This Green-scheduler effectively acts as a 'FinOps with a carbon tracker', meaning carbon savings directly translate to cost savings on cloud infrastructure."""
    doc.add_paragraph(research_text, style='Normal')
    doc.add_page_break()

def add_future_work(doc):
    doc.add_paragraph('5. FUTURE WORK', style='ReportHeading')
    future_text = """Next Steps for Implementation:
1. Select our pilot task (e.g., a nightly CI build or a weekly ML retraining job).
2. Set up an account with ElectricityMaps or WattTime for our target region.
3. Draft the 'sustainability_policy.yaml' thresholds based on average grid data."""
    doc.add_paragraph(future_text, style='Normal')
    doc.add_page_break()

def add_references(doc):
    doc.add_paragraph('6. REFERENCES', style='ReportHeading')
    ref_text = """[1] Green Software Foundation, "Carbon Aware SDK Documentation".
[2] "Temporal vs Spatial Shifting in Cloud Computing," Cloud Sustainability Reports, 2025."""
    doc.add_paragraph(ref_text, style='Normal')

def add_header_footer(doc):
    for section in doc.sections:
        # Header
        header = section.header
        htable = header.add_table(1, 2, Inches(6))
        htab_cells = htable.rows[0].cells
        ht0 = htab_cells[0].paragraphs[0]
        ht0.text = "INDUSTRY INTERNSHIP REPORT"
        ht0.style.font.size = Pt(10)
        
        ht1 = htab_cells[1].paragraphs[0]
        ht1.text = "16103458"
        ht1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        ht1.style.font.size = Pt(10)

        # Footer
        footer = section.footer
        ftable = footer.add_table(1, 2, Inches(6))
        ftab_cells = ftable.rows[0].cells
        ft0 = ftab_cells[0].paragraphs[0]
        ft0.text = "NUV/SET/CSE 2025-2026"
        ft0.style.font.size = Pt(10)

add_title_page(doc)
add_certificate(doc)
add_acknowledgment(doc)
add_abstract(doc)
add_toc(doc)
add_chapters(doc)
add_future_work(doc)
add_references(doc)

# Save document
doc.save('GreenScheduler_Project_Report.docx')
print("Document generated successfully.")
