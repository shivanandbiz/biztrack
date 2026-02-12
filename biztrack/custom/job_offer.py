import frappe

@frappe.whitelist()
def set_print_format(doc, method=None):
    """
    Automatically set print format based on employment type or saved custom print format.
    """
    # If user already selected print format in UI, respect it
    if doc.custom_selected_print_format:
        doc.meta.default_print_format = doc.custom_selected_print_format
        return

    # Map employment type → print format
    format_map = {
        'FULL TIME EMPLOYEMENT-OFFER LETTER': 'FULL TIME EMPLOYEMENT-OFFER LETTER',
        'INTERNSHIP - OFFER LETTER': 'INTERNSHIP - OFFER LETTER',
        'FREELANCE CONTRACT-JOB OFFER': 'FREELANCE CONTRACT-JOB OFFER'
    }

    emp_type = doc.custom_employment_type_

    if emp_type and emp_type in format_map:
        selected_format = format_map[emp_type]

        # Update the custom field
        doc.custom_selected_print_format = selected_format

        # Apply to document
        doc.meta.default_print_format = selected_format

        # Persist for this specific Job Offer
        frappe.db.set_value("Job Offer", doc.name, "custom_selected_print_format", selected_format)
