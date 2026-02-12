# import frappe
# from frappe.desk.page import dashboard

# def setup_dashboard():
#     """Setup Application Tracking Dashboard"""
    
#     # Create dashboard charts
#     create_dashboard_charts()
    
#     # Create dashboard page
#     create_dashboard_page()
    
#     frappe.db.commit()

# def create_dashboard_charts():
#     """Create predefined dashboard charts"""
    
#     charts = [
#         {
#             "name": "Application Usage Summary",
#             "chart_name": "Application Usage Summary",
#             "chart_type": "Bar",
#             "doctype": "Application Tracking",
#             "group_by_based_on": "applications",
#             "value_based_on": "spent_time",
#             "time_interval": "Daily",
#             "timeseries": 1,
#             "based_on": "creation"
#         },
#         {
#             "name": "Top Applications",
#             "chart_name": "Top Applications", 
#             "chart_type": "Bar",
#             "doctype": "Application Tracking",
#             "group_by_based_on": "applications",
#             "value_based_on": "spent_time",
#             "time_interval": "Daily",
#             "timeseries": 0,
#             "based_on": "creation"
#         },
#         {
#             "name": "Category Breakdown",
#             "chart_name": "Category Breakdown",
#             "chart_type": "Pie", 
#             "doctype": "Application Tracking",
#             "group_by_based_on": "category",
#             "value_based_on": "spent_time",
#             "time_interval": "Daily",
#             "timeseries": 0,
#             "based_on": "creation"
#         }
#     ]
    
#     for chart_data in charts:
#         if not frappe.db.exists("Dashboard Chart", chart_data["name"]):
#             chart = frappe.new_doc("Dashboard Chart")
#             chart.update(chart_data)
#             chart.save()

# def create_dashboard_page():
#     """Create custom dashboard page"""
    
#     if not frappe.db.exists("Page", "activity-dashboard"):
#         page = frappe.new_doc("Page")
#         page.update({
#             "name": "activity-dashboard",
#             "title": "Activity Dashboard",
#             "page_name": "activity-dashboard",
#             "module": "Biztrack",
#             "standard": "Yes"
#         })
#         page.save()

# # Run setup when module is installed
# if __name__ == "__main__":
#     setup_dashboard()