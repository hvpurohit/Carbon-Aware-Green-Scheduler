from fpdf import FPDF
import datetime
import os

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        # Calculate width of title and position
        w = self.get_string_width('Green-Scheduler Sustainability Certificate') + 6
        self.set_x((210 - w) / 2)
        # Colors: Green header
        self.set_draw_color(0, 128, 0)
        self.set_fill_color(200, 255, 200)
        self.set_text_color(0, 100, 0)
        # Title
        self.cell(w, 10, 'Green-Scheduler Sustainability Certificate', 1, 1, 'C', 1)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

def generate_certificate(job_id: str, decision_data: dict, execution_data: dict):
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font('Times', '', 12)
    
    pdf.cell(0, 10, f"Certificate of Sustainable Execution", 0, 1, 'C')
    pdf.set_font('Times', '', 10)
    pdf.cell(0, 10, f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, 'C')
    
    pdf.ln(10)
    
    pdf.set_font('Times', 'B', 12)
    pdf.cell(0, 10, 'Job Details:', 0, 1)
    pdf.set_font('Times', '', 12)
    pdf.cell(0, 10, f"- Job ID: {job_id}", 0, 1)
    pdf.cell(0, 10, f"- Priority: {decision_data['priority']}", 0, 1)
    pdf.cell(0, 10, f"- Status: {execution_data['status']} (Duration: {execution_data['duration_seconds']}s)", 0, 1)
    
    pdf.ln(10)
    
    pdf.set_font('Times', 'B', 12)
    pdf.cell(0, 10, 'Grid Parameters at Execution:', 0, 1)
    pdf.set_font('Times', '', 12)
    grid = decision_data['grid_data']
    pdf.cell(0, 10, f"- Region: {grid['region']}", 0, 1)
    pdf.cell(0, 10, f"- Carbon Intensity: {grid['intensity']} gCO2eq/kWh", 0, 1)
    pdf.cell(0, 10, f"- Grid Status: {grid['status'].upper()}", 0, 1)
    pdf.cell(0, 10, f"- Policy Threshold: {decision_data['threshold']} gCO2eq/kWh", 0, 1)
    
    pdf.ln(10)
    pdf.set_font('Times', 'I', 11)
    pdf.multi_cell(0, 10, f"This job was verified to run securely under sustainable grid conditions as defined by the internal green ops policy. The carbon intensity was {decision_data['threshold'] - grid['intensity']} gCO2eq/kWh below the maximum allowed threshold.")

    if execution_data.get('output'):
        pdf.ln(10)
        pdf.set_font('Times', 'B', 12)
        pdf.cell(0, 10, 'Execution Output:', 0, 1)
        pdf.set_font('Courier', '', 10)
        # Handle potential unicode characters that FPDF doesn't like
        safe_output = execution_data['output'].encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 5, safe_output)

    filepath = os.path.join(REPORTS_DIR, f"cert_{job_id}.pdf")
    pdf.output(filepath, 'F')
    
    return filepath
