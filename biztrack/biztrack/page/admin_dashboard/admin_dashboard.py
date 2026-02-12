# admin_dashboard.py

import frappe
from frappe import _
from datetime import datetime, timedelta
from frappe.utils import flt, cint, getdate, add_days, nowdate

@frappe.whitelist()
def get_dashboard_data(company=None):
    """
    Main function to get all dashboard data
    """
    try:
        data = {
            'crm': get_crm_data(company),
            'accounting': get_accounting_data(company),
            'activity': get_activity_data(company),
            'contracts': get_service_contracts_data(company),
            'products': get_product_category_data(company),
            'todos': get_todo_data(company),
            'activity_log': get_activity_log_data(company)
        }
        return data
    except Exception as e:
        frappe.log_error(f"Dashboard Data Error: {str(e)}")
        return {"error": str(e)}

def get_crm_data(company=None):
    """
    Get CRM related metrics
    """
    try:
        # Base filters
        filters = {}
        if company:
            filters['company'] = company

        # Lead metrics
        new_leads = frappe.db.count('Lead', {
            **filters,
            'status': 'Lead',
            'creation': ['>=', add_days(nowdate(), -30)]
        })
        
        qualified_leads = frappe.db.count('Lead', {
            **filters,
            'qualification_status': 'Qualified'
        })
        
        converted_leads = frappe.db.count('Lead', {
            **filters,
            'status': 'Converted'
        })
        
        lost_leads = frappe.db.count('Lead', {
            **filters,
            'status': 'Do Not Contact'
        })

        # Opportunities value
        opportunities = frappe.db.sql("""
            SELECT COALESCE(SUM(opportunity_amount), 0) as total_value
            FROM `tabOpportunity`
            WHERE docstatus = 0
            AND status NOT IN ('Lost', 'Closed')
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # Sales Order value
        sales_orders = frappe.db.sql("""
            SELECT COALESCE(SUM(grand_total), 0) as total_value
            FROM `tabSales Order`
            WHERE docstatus = 1
            AND status NOT IN ('Cancelled')
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # Target achievement (you may need to customize this based on your target setup)
        target_achieved = calculate_target_achievement(company)

        return {
            'leads': {
                'new': new_leads,
                'qualified': qualified_leads,
                'converted': converted_leads,
                'lost': lost_leads
            },
            'opportunities_value': opportunities.get('total_value', 0),
            'sales_order_value': sales_orders.get('total_value', 0),
            'target_achieved': target_achieved
        }
    except Exception as e:
        frappe.log_error(f"CRM Data Error: {str(e)}")
        return {}

def get_accounting_data(company=None):
    """
    Get accounting related metrics
    """
    try:
        # Base filters
        filters = {}
        if company:
            filters['company'] = company

        # Outstanding amount
        outstanding = frappe.db.sql("""
            SELECT COALESCE(SUM(outstanding_amount), 0) as outstanding
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            AND outstanding_amount > 0
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # Total billed amount
        total_billed = frappe.db.sql("""
            SELECT COALESCE(SUM(grand_total), 0) as total_billed
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # Amount received
        amount_received = frappe.db.sql("""
            SELECT COALESCE(SUM(paid_amount), 0) as received
            FROM `tabPayment Entry`
            WHERE docstatus = 1
            AND payment_type = 'Receive'
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # Yet to receive = Total billed - Amount received
        yet_to_receive = total_billed.get('total_billed', 0) - amount_received.get('received', 0)

        return {
            'outstanding_amount': outstanding.get('outstanding', 0),
            'total_billed': total_billed.get('total_billed', 0),
            'amount_received': amount_received.get('received', 0),
            'yet_to_receive': yet_to_receive
        }
    except Exception as e:
        frappe.log_error(f"Accounting Data Error: {str(e)}")
        return {}

def get_activity_data(company=None):
    """
    Get activity related metrics
    """
    try:
        # Base filters
        filters = {}
        if company:
            filters['company'] = company

        # Task metrics
        completed_tasks = frappe.db.count('Task', {
            **filters,
            'status': 'Completed'
        })
        
        pending_tasks = frappe.db.count('Task', {
            **filters,
            'status': ['!=', 'Completed']
        })

        # Quotations count
        quotations_count = frappe.db.count('Quotation', {
            **filters,
            'docstatus': 1,
            'creation': ['>=', add_days(nowdate(), -30)]
        })

        # Active projects
        active_projects = frappe.db.count('Project', {
            **filters,
            'status': 'Open'
        })
        
        inactive_projects = frappe.db.count('Project', {
            **filters,
            'status': ['!=', 'Open']
        })

        # Status alerts (you may need to customize based on your project status logic)
        status_alerts = get_project_status_alerts(company)

        return {
            'tasks': {
                'completed': completed_tasks,
                'pending': pending_tasks
            },
            'quotations_count': quotations_count,
            'projects': {
                'active': active_projects,
                'inactive': inactive_projects
            },
            'status_alerts': status_alerts
        }
    except Exception as e:
        frappe.log_error(f"Activity Data Error: {str(e)}")
        return {}

def get_service_contracts_data(company=None):
    """
    Get service contracts related metrics
    """
    try:
        # Base filters
        filters = {}
        if company:
            filters['company'] = company

        # Expired contracts
        expired_contracts = frappe.db.count('Contract', {
            **filters,
            'end_date': ['<', nowdate()],
            'status': ['!=', 'Inactive']
        })

        # Contracts expiring in next 15 days
        expiring_soon = frappe.db.count('Contract', {
            **filters,
            'end_date': ['between', [nowdate(), add_days(nowdate(), 15)]],
            'status': ['!=', 'Inactive']
        })

        # Active contracts
        active_contracts = frappe.db.count('Contract', {
            **filters,
            'status': 'Active',
            'end_date': ['>=', nowdate()]
        })

        return {
            'expired_contracts': expired_contracts,
            'expiring_in_15_days': expiring_soon,
            'active_contracts': active_contracts
        }
    except Exception as e:
        frappe.log_error(f"Service Contracts Data Error: {str(e)}")
        return {}

def get_product_category_data(company=None):
    """
    Get product category wise revenue
    """
    try:
        # Base filters
        filters = {}
        if company:
            filters['company'] = company

        # Staffing revenue
        staffing_revenue = frappe.db.sql("""
            SELECT COALESCE(SUM(si.grand_total), 0) as revenue
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON si.name = sii.parent
            JOIN `tabItem` i ON sii.item_code = i.name
            WHERE si.docstatus = 1
            AND i.item_group = 'Staffing'
            {}
        """.format("AND si.company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        # CRM Doctor revenue
        crm_doctor_revenue = frappe.db.sql("""
            SELECT COALESCE(SUM(si.grand_total), 0) as revenue
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON si.name = sii.parent
            JOIN `tabItem` i ON sii.item_code = i.name
            WHERE si.docstatus = 1
            AND i.item_group = 'CRM Doctor'
            {}
        """.format("AND si.company = %(company)s" if company else ""), {
            'company': company
        }, as_dict=True)[0]

        return {
            'staffing_revenue': staffing_revenue.get('revenue', 0),
            'crm_doctor_revenue': crm_doctor_revenue.get('revenue', 0)
        }
    except Exception as e:
        frappe.log_error(f"Product Category Data Error: {str(e)}")
        return {}

def get_todo_data(company=None):
    """
    Get ToDo data with scrollable records
    """
    try:
        # Base query for todos
        base_query = """
            SELECT 
                t.name,
                t.description,
                t.status,
                t.priority,
                t.date,
                t.allocated_to,
                u.full_name as employee_name,
                t.creation,
                t.modified
            FROM `tabToDo` t
            LEFT JOIN `tabUser` u ON t.allocated_to = u.name
            WHERE t.docstatus != 2
        """
        
        # Add company filter if provided
        conditions = []
        params = {}
        
        if company:
            # Check if ToDo doctype has company field, if not, filter by user's company
            if frappe.db.has_column('ToDo', 'company'):
                conditions.append("AND t.company = %(company)s")
                params['company'] = company
            else:
                # Filter by users belonging to the company
                conditions.append("""
                    AND t.allocated_to IN (
                        SELECT name FROM `tabUser` 
                        WHERE company = %(company)s OR name IN (
                            SELECT parent FROM `tabUser Permission` 
                            WHERE allow = 'Company' AND for_value = %(company)s
                        )
                    )
                """)
                params['company'] = company
        
        # Get recent todos (last 30 days)
        recent_query = base_query + " ".join(conditions) + " AND t.creation >= %(from_date)s ORDER BY t.creation DESC LIMIT 100"
        params['from_date'] = add_days(nowdate(), -30)
        
        recent_todos = frappe.db.sql(recent_query, params, as_dict=True)
        
        # Get counts by status
        count_query = """
            SELECT 
                t.status,
                COUNT(*) as count
            FROM `tabToDo` t
            WHERE t.docstatus != 2
        """
        
        if company:
            if frappe.db.has_column('ToDo', 'company'):
                count_query += " AND t.company = %(company)s"
            else:
                count_query += """
                    AND t.allocated_to IN (
                        SELECT name FROM `tabUser` 
                        WHERE company = %(company)s OR name IN (
                            SELECT parent FROM `tabUser Permission` 
                            WHERE allow = 'Company' AND for_value = %(company)s
                        )
                    )
                """
        
        count_query += " GROUP BY t.status"
        
        status_counts = frappe.db.sql(count_query, {'company': company} if company else {}, as_dict=True)
        
        # Convert to dictionary for easier access
        counts_dict = {item['status']: item['count'] for item in status_counts}
        
        return {
            'records': recent_todos,
            'counts': {
                'open': counts_dict.get('Open', 0),
                'closed': counts_dict.get('Closed', 0),
                'cancelled': counts_dict.get('Cancelled', 0)
            },
            'total_records': len(recent_todos)
        }
    except Exception as e:
        frappe.log_error(f"ToDo Data Error: {str(e)}")
        return {'records': [], 'counts': {'open': 0, 'closed': 0, 'cancelled': 0}, 'total_records': 0}


def get_activity_log_data(company=None):
    """
    Get Activity Log data with scrollable records
    """
    try:
        # Base query for activity logs
        base_query = """
            SELECT 
                al.name,
                al.subject,
                al.content,
                al.status,
                al.reference_doctype,
                al.reference_name,
                al.timeline_doctype,
                al.timeline_name,
                al.user,
                u.full_name as employee_name,
                al.creation,
                al.modified
            FROM `tabActivity Log` al
            LEFT JOIN `tabUser` u ON al.user = u.name
            WHERE 1=1
        """
        
        # Add company filter if provided
        conditions = []
        params = {}
        
        if company:
            # Filter by users belonging to the company or by reference documents
            conditions.append("""
                AND (al.user IN (
                    SELECT name FROM `tabUser` 
                    WHERE company = %(company)s OR name IN (
                        SELECT parent FROM `tabUser Permission` 
                        WHERE allow = 'Company' AND for_value = %(company)s
                    )
                ) OR (
                    al.reference_doctype IN ('Lead', 'Opportunity', 'Customer', 'Sales Order', 'Sales Invoice', 'Project', 'Task')
                    AND EXISTS (
                        SELECT 1 FROM `tab{doctype}` 
                        WHERE name = al.reference_name AND company = %(company)s
                    )
                ))
            """)
            params['company'] = company
        
        # Get recent activity logs (last 7 days)
        recent_query = base_query + " ".join(conditions) + " AND al.creation >= %(from_date)s ORDER BY al.creation DESC LIMIT 100"
        params['from_date'] = add_days(nowdate(), -7)
        
        recent_logs = frappe.db.sql(recent_query, params, as_dict=True)
        
        # Get counts by communication type
        count_query = """
            SELECT 
                al.status,
                COUNT(*) as count
            FROM `tabActivity Log` al
            WHERE al.creation >= %(from_date)s
        """
        
        if company:
            count_query += """
                AND (al.user IN (
                    SELECT name FROM `tabUser` 
                    WHERE company = %(company)s OR name IN (
                        SELECT parent FROM `tabUser Permission` 
                        WHERE allow = 'Company' AND for_value = %(company)s
                    )
                ) OR (
                    al.reference_doctype IN ('Lead', 'Opportunity', 'Customer', 'Sales Order', 'Sales Invoice', 'Project', 'Task')
                ))
            """
        
        count_query += " GROUP BY al.status"
        
        type_counts = frappe.db.sql(count_query, {
            'company': company,
            'from_date': add_days(nowdate(), -7)
        } if company else {
            'from_date': add_days(nowdate(), -7)
        }, as_dict=True)
        
        # Convert to dictionary for easier access
        counts_dict = {item['status']: item['count'] for item in type_counts if item['status']}
        
        return {
            'records': recent_logs,
            'counts': {
                'email': counts_dict.get('Success', 0),
                'call': counts_dict.get('Failed', 0),
                'meeting': counts_dict.get('Linked', 0),
                'comment': counts_dict.get('Closed', 0),
                'other': sum(count for type_name, count in counts_dict.items() 
                           if type_name not in ['Success', 'Failed', 'Linked', 'Closed'])
            },
            'total_records': len(recent_logs)
        }
    except Exception as e:
        frappe.log_error(f"Activity Log Data Error: {str(e)}")
        return {'records': [], 'counts': {'email': 0, 'call': 0, 'meeting': 0, 'comment': 0, 'other': 0}, 'total_records': 0}

def calculate_target_achievement(company=None):
    """
    Calculate target achievement percentage
    """
    try:
        # This is a simplified calculation - customize based on your target setup
        current_year = datetime.now().year
        
        # Get sales target for the year
        target = frappe.db.sql("""
            SELECT COALESCE(SUM(target_amount), 0) as target
            FROM `tabTarget Detail`
            WHERE fiscal_year = %(year)s
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'year': current_year,
            'company': company
        }, as_dict=True)[0]

        # Get actual sales
        actual = frappe.db.sql("""
            SELECT COALESCE(SUM(grand_total), 0) as actual
            FROM `tabSales Order`
            WHERE docstatus = 1
            AND YEAR(transaction_date) = %(year)s
            {}
        """.format("AND company = %(company)s" if company else ""), {
            'year': current_year,
            'company': company
        }, as_dict=True)[0]

        if target.get('target', 0) > 0:
            achievement = (actual.get('actual', 0) / target.get('target', 0)) * 100
            return round(achievement, 2)
        return 0
    except Exception as e:
        frappe.log_error(f"Target Achievement Error: {str(e)}")
        return 0

def get_project_status_alerts(company=None):
    """
    Get project status alerts based on your color coding system
    """
    try:
        # Red alerts - projects needing Kalpesh Sir escalation
        red_alerts = frappe.db.count('Project', {
            'status': 'Open',
            'priority': 'High',
            # 'escalation_level': 'red',
            'expected_end_date': ['<', add_days(nowdate(), 7)],
            **({"company": company} if company else {})
        })

        # Yellow alerts - projects that might need Kalpesh Sir involvement
        yellow_alerts = frappe.db.count('Project', {
            'status': 'Open',
            'priority': 'Medium',
            # 'escalation_level': 'yellow',
            'percent_complete': ['<', 50],
            **({"company": company} if company else {})
        })

        # Green status - projects proceeding well
        green_status = frappe.db.count('Project', {
            'status': 'Open',
            'priority': 'Low',
            # 'escalation_level': 'green',
            'percent_complete': ['>=', 50],
            **({"company": company} if company else {})
        })

        return {
            'red': red_alerts,
            'yellow': yellow_alerts,
            'green': green_status
        }
    except Exception as e:
        frappe.log_error(f"Project Status Alerts Error: {str(e)}")
        return {'red': 0, 'yellow': 0, 'green': 0}

@frappe.whitelist()
def get_company_list():
    """
    Get list of companies for filter dropdown
    """
    try:
        companies = frappe.db.get_all('Company', 
            fields=['name', 'company_name'],
            filters={'disabled': 0}
        )
        return companies
    except Exception as e:
        frappe.log_error(f"Company List Error: {str(e)}")
        return []