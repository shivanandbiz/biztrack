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
def get_hourly_activity(date=None, employee=None):
    """Get hour-by-hour activity breakdown for a single day"""
    
    if not date:
        date = frappe.utils.today()
    
    conditions = f"DATE(creation) = '{date}'"
    
    if employee:
        conditions += f" AND employee = '{employee}'"
    
    # Get hourly breakdown (0-23 hours)
    hourly_data = frappe.db.sql(f"""
        SELECT 
            HOUR(creation) as hour,
            SUM(duration) as total_time,
            COUNT(*) as session_count,
            COUNT(DISTINCT applications) as unique_apps
        FROM `tabApplications Tracking`
        WHERE {conditions}
        GROUP BY HOUR(creation)
        ORDER BY hour
    """, as_dict=True)
    
    # Create a complete 24-hour array (fill missing hours with 0)
    hourly_complete = []
    hourly_dict = {int(h['hour']): h for h in hourly_data}
    
    for hour in range(24):
        if hour in hourly_dict:
            hourly_complete.append(hourly_dict[hour])
        else:
            hourly_complete.append({
                'hour': hour,
                'total_time': 0,
                'session_count': 0,
                'unique_apps': 0
            })
    
    return hourly_complete

@frappe.whitelist()
def get_browser_domains(date=None, employee=None):
    """Extract and analyze browser domains from window titles"""
    import re
    
    if not date:
        date = frappe.utils.today()
    
    conditions = f"DATE(creation) = '{date}'"
    
    if employee:
        conditions += f" AND employee = '{employee}'"
    
    # Get browser activity (Chrome, Firefox, Edge, etc.)
    # We look for apps that are known browsers
    browser_apps = "('Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Safari', 'Opera', 'Brave')"
    
    browser_activity = frappe.db.sql(f"""
        SELECT 
            window_title,
            applications,
            SUM(duration) as total_time,
            COUNT(*) as session_count
        FROM `tabApplications Tracking`
        WHERE {conditions} 
            AND applications IN {browser_apps}
            AND window_title IS NOT NULL
            AND window_title != ''
        GROUP BY window_title, applications
        ORDER BY total_time DESC
    """, as_dict=True)
    
    # Extract domains from window titles
    domains = {}
    
    for activity in browser_activity:
        domain = extract_domain_from_title(activity.window_title)
        
        # If we couldn't extract a domain, use the app name as fallback if generic
        if not domain and activity.window_title:
             # Try stricter extraction or just group by window title for now if critical
             pass
             
        if domain:
            if domain not in domains:
                domains[domain] = {
                    'domain': domain,
                    'total_time': 0,
                    'session_count': 0,
                    'pages': [],
                    'icon': get_favicon_url(domain)
                }
            
            domains[domain]['total_time'] += activity.total_time
            domains[domain]['session_count'] += activity.session_count
            
            # Add page title if not already added (keep distinct pages)
            if len(domains[domain]['pages']) < 5: # Limit to top 5 pages per domain
                # Check if page already exists to avoid duplicates
                page_exists = False
                for p in domains[domain]['pages']:
                    if p['title'] == activity.window_title:
                        p['time'] += activity.total_time
                        page_exists = True
                        break
                
                if not page_exists:
                    domains[domain]['pages'].append({
                        'title': activity.window_title,
                        'time': activity.total_time
                    })
    
    # Convert to list and sort
    result = list(domains.values())
    return sorted(result, key=lambda x: x['total_time'], reverse=True)[:50]

def extract_domain_from_title(title):
    """Helper to extract domain from browser window title"""
    import re
    
    if not title:
        return None
        
    # Common patterns: 
    # "Page Title - Google Chrome" 
    # "Page Title - Mozilla Firefox"
    # "github.com - ..."
    # "https://www.google.com/..."
    
    # Clean up common browser suffixes
    clean_title = title
    suffixes = [' - Google Chrome', ' - Mozilla Firefox', ' - Microsoft Edge', ' - Opera', ' - Brave']
    for suffix in suffixes:
        if clean_title.endswith(suffix):
            clean_title = clean_title.replace(suffix, '')
    
    # Regex to find domain-like patterns
    # Matches: example.com, www.example.com, sub.example.co.uk
    domain_pattern = r'(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})'
    
    # First check if title STARTS with a URL/domain (common in history)
    match = re.match(domain_pattern, clean_title)
    if match:
        return match.group(1).lower()
        
    # Check for domain inside the title (e.g. "Inbox (1) - gmail.com")
    # This is harder and might return false positives, so we stick to known high-value targets if general regex fails
    
    # List of common domains to look for specifically if regex fails
    common_domains = ['github.com', 'google.com', 'stackoverflow.com', 'youtube.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'gmail.com', 'outlook.com', 'biztechnosys.com', 'localhost']
    
    for d in common_domains:
        if d in clean_title.lower():
            return d
            
    # Try to find anything looking like a domain at the end or enclosed in chars
    # ...
    
    return None # Return None if no clear domain found

def get_favicon_url(domain):
    """Get favicon URL for domain"""
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=32"

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

@frappe.whitelist()
def get_category_hierarchy(date=None, employee=None):
    """Get hierarchical category data for tree/sunburst visualization"""
    
    if not date:
        date = frappe.utils.today()
    
    conditions = f"DATE(creation) = '{date}'"
    
    if employee:
        conditions += f" AND employee = '{employee}'"
    
    categories = frappe.db.sql(f"""
        SELECT 
            category,
            SUM(duration) as total_time,
            COUNT(*) as session_count,
            GROUP_CONCAT(DISTINCT applications) as apps
        FROM `tabApplications Tracking`
        WHERE {conditions} AND category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY total_time DESC
    """, as_dict=True)
    
    # Build hierarchy (assuming categories use ">" separator like "Work > Programming")
    # If no separator, it treats as flat hierarchy
    hierarchy = build_category_tree(categories)
    return hierarchy

def build_category_tree(categories):
    """Build hierarchical tree from flat category list"""
    tree = {
        'name': 'root',
        'children': []
    }
    
    # Helper to find or create child node
    def get_or_create_child(parent_children, name):
        for child in parent_children:
            if child['name'] == name:
                return child
        
        new_child = {
            'name': name,
            'value': 0,
            'sessions': 0,
            'children': []
        }
        parent_children.append(new_child)
        return new_child

    for cat in categories:
        # Split category by separator (handling different potential separators)
        if ' > ' in cat.category:
            parts = cat.category.split(' > ')
        elif '>' in cat.category:
            parts = cat.category.split('>')
        elif ' - ' in cat.category:
            parts = cat.category.split(' - ')
        else:
            parts = [cat.category]
            
        current_children = tree['children']
        
        for i, part in enumerate(parts):
            part = part.strip()
            node = get_or_create_child(current_children, part)
            
            # Add values to current node (aggregating up the tree)
            node['value'] += cat.total_time
            node['sessions'] += cat.session_count
            
            # Move down to children
            current_children = node['children']
            
    return tree