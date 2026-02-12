# Copyright (c) 2025, Shivanand and contributors
# For license information, please see license.txt

# import frappe

import frappe

def execute(filters=None):
    """
    Applications Tracking Report
    Shows all draft Applications Tracking records with complete details
    """
    
    # Build filter conditions
    conditions = {"docstatus": 0}
    
    # Add additional filters if provided
    if filters:
        if filters.get("employee"):
            conditions["employee"] = filters.get("employee")
        if filters.get("employee_name"):
            conditions["employee_name"] = ["like", f"%{filters.get('employee_name')}%"]
        if filters.get("event_name"):
            conditions["event_name"] = ["like", f"%{filters.get('event_name')}%"]
        if filters.get("from_date"):
            conditions["creation"] = [">=", filters.get("from_date")]
        if filters.get("to_date"):
            if conditions.get("creation"):
                conditions["creation"] = ["between", [filters.get("from_date"), filters.get("to_date")]]
            else:
                conditions["creation"] = ["<=", filters.get("to_date")]
    
    # Fetch data from Applications Tracking doctype
    data = frappe.db.get_all(
        "Applications Tracking",
        filters=conditions,
        fields=[
            "name",
            "employee_name", 
            "employee",
            "event_name",
            "duration",
            "applications",
            "name1",           # New field added
            "application_id",  # New field added
            "event_id",        # New field added
            "idle_duration"    # New field added
        ],
        order_by="creation desc"
    )
    
    # Define columns with exact specifications from your SQL query
    columns = [
        {
            "label": "ID",
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "Applications Tracking",
            "width": 120
        },
        {
            "label": "Employee Name",
            "fieldname": "employee_name",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Employee Email",
            "fieldname": "employee",
            "fieldtype": "Link",
            "options": "User",
            "width": 120
        },
        {
            "label": "Event ID",          # New column added
            "fieldname": "event_id",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Event Name",
            "fieldname": "event_name",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": "Application ID",    # New column added
            "fieldname": "application_id",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Applications",
            "fieldname": "applications",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": "Spent Time",
            "fieldname": "duration",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": "Name",              # New column added
            "fieldname": "name1",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": "Idle Duration",     # New column added
            "fieldname": "idle_duration",
            "fieldtype": "Float",
            "width": 120
        }
    ]
    
    return columns, data