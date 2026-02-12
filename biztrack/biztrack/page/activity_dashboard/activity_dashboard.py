# //activity_dashboard.py

import frappe
from frappe import _
from frappe.utils import flt, time_diff_in_seconds, get_datetime
import json

@frappe.whitelist()
def get_activity_summary(date=None, employee=None):
    """Get activity summary data for dashboard"""
    
    conditions = "1=1"
    
    if date:
        conditions += f" AND DATE(creation) = '{date}'"
    else:
        # If no date provided, use today
        today = frappe.utils.today()
        conditions += f" AND DATE(creation) = '{today}'"
    
    if employee:
        conditions += f" AND employee = '{employee}'"
    
    # Top Applications
    top_apps = frappe.db.sql(f"""
        SELECT 
            applications,
            SUM(duration) as total_time,
            COUNT(*) as session_count
        FROM `tabApplications Tracking`
        WHERE {conditions}
        GROUP BY applications
        ORDER BY total_time DESC
        LIMIT 10
    """, as_dict=True)
    
    # Top Categories
    top_categories = frappe.db.sql(f"""
        SELECT 
            category,
            SUM(duration) as total_time,
            COUNT(*) as session_count
        FROM `tabApplications Tracking`
        WHERE {conditions} AND category IS NOT NULL
        GROUP BY category
        ORDER BY total_time DESC
        LIMIT 10
    """, as_dict=True)
    
    # Employee Activity
    employee_activity = frappe.db.sql(f"""
        SELECT 
            employee_name,
            employee,
            SUM(duration) as total_time,
            COUNT(*) as session_count,
            COUNT(DISTINCT applications) as unique_apps
        FROM `tabApplications Tracking`
        WHERE {conditions}
        GROUP BY employee_name, employee
        ORDER BY total_time DESC
        LIMIT 10
    """, as_dict=True)
    
    # Daily Activity Timeline (for the selected date, show hourly breakdown)
    daily_activity = frappe.db.sql(f"""
        SELECT 
            DATE(creation) as date,
            SUM(duration) as total_time,
            COUNT(*) as session_count
        FROM `tabApplications Tracking`
        WHERE {conditions}
        GROUP BY DATE(creation)
        ORDER BY DATE(creation)
    """, as_dict=True)
    
    # Window Titles Analysis
    window_titles = frappe.db.sql(f"""
        SELECT 
            window_title,
            applications,
            SUM(duration) as total_time,
            COUNT(*) as frequency
        FROM `tabApplications Tracking`
        WHERE {conditions} AND window_title IS NOT NULL
        GROUP BY window_title, applications
        ORDER BY total_time DESC
        LIMIT 20
    """, as_dict=True)
    
    return {
        "top_applications": top_apps,
        "top_categories": top_categories,
        "employee_activity": employee_activity,
        "daily_activity": daily_activity,
        "window_titles": window_titles
    }

@frappe.whitelist()
def get_real_time_activity(employee=None):
    """Get current day's activity for real-time updates"""
    
    today = frappe.utils.today()
    
    conditions = f"DATE(creation) = '{today}'"
    
    if employee:
        conditions += f" AND employee = '{employee}'"
    
    current_activity = frappe.db.sql(f"""
        SELECT 
            applications,
            application_id,
            event_name,
            event_id,
            window_title,
            category,
            to_date,
            duration,
            idle_duration,
            creation,
            employee_name,
            employee
        FROM `tabApplications Tracking`
        WHERE {conditions}
        ORDER BY creation DESC
        LIMIT 50
    """, as_dict=True)
    
    return current_activity

@frappe.whitelist()
def get_employees():
    """Get list of employees from Applications Tracking"""
    
    employees = frappe.db.sql("""
        SELECT DISTINCT 
            employee,
            employee_name
        FROM `tabApplications Tracking`
        WHERE employee IS NOT NULL AND employee_name IS NOT NULL
        ORDER BY employee_name
    """, as_dict=True)
    
    return employees