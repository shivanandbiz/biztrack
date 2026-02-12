app_name = "biztrack"
app_title = "Biztrack"
app_publisher = "Shivanand"
app_description = "Biztrack Application Tracking"
app_email = "shivanand.b@biztechnosys.com"
app_license = "mit"


# after_install = "biztrack.biztrack.dashboard_setup.setup_dashboard"
# Include files
app_include_css = "/assets/biztrack/css/activity_dashboard.css"

app_include_js = [
    "/assets/biztrack/js/company_theme.js"
]
# app_include_js = "/assets/biztrack/js/erp_chatbot.js"


# Website route rules
website_route_rules = [
    {"from_route": "/activity-dashboard", "to_route": "activity-dashboard"},
]

# Fixtures
fixtures = [
    {"doctype": "Dashboard Chart", "filters": {"module": "Biztrack"}},
]


api_methods = [
    "biztrack.biztrack.page.admin_dashboard.admin_dashboard.get_dashboard_data",
    "biztrack.biztrack.page.admin_dashboard.admin_dashboard.get_company_list",
    "biztrack.biztrack.page.admin_dashboard.notifications.send_test_notification"
]

scheduler_events = {
    "daily": [
        "biztrack.biztrack.page.notifications.send_contract_expiry_alerts"
    ]
}

doc_events = {
    # "Contract": {
    #     "after_insert": "biztrack.biztrack.page.notifications.contract_created",
    #     "on_update": "biztrack.biztrack.page.notifications.contract_updated",
    #     "on_cancel": "biztrack.biztrack.page.notifications.contract_cancelled"
    # }
    # "Lead": {
    #     "on_update": "biztrack.biztrack.page.events.lead_updated"
    # },
    # "Project": {
    #     "on_update": "biztrack.biztrack.page.events.project_updated"
    # }
}

# Custom permissions
# permission_query_conditions = {
#     "Contract": "biztrack.biztrack.page.permissions.get_contract_permission_query_conditions"
# }


# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "biztrack",
# 		"logo": "/assets/biztrack/logo.png",
# 		"title": "Biztrack",
# 		"route": "/biztrack",
# 		"has_permission": "biztrack.api.permission.has_app_permission"
# 	}
# ]
doc_events = {
    "Job Offer": {
        "on_load": "biztrack.custom.job_offer.set_print_format",
        "validate": "biztrack.custom.job_offer.set_print_format",
        "on_submit": "biztrack.custom.job_offer.set_print_format"
    }
}
# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/biztrack/css/biztrack.css"
# app_include_js = "/assets/biztrack/js/biztrack.js"

# include js, css files in header of web template
# web_include_css = "/assets/biztrack/css/biztrack.css"
# web_include_js = "/assets/biztrack/js/biztrack.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "biztrack/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "biztrack/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "biztrack.utils.jinja_methods",
# 	"filters": "biztrack.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "biztrack.install.before_install"
# after_install = "biztrack.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "biztrack.uninstall.before_uninstall"
# after_uninstall = "biztrack.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "biztrack.utils.before_app_install"
# after_app_install = "biztrack.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "biztrack.utils.before_app_uninstall"
# after_app_uninstall = "biztrack.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "biztrack.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"biztrack.tasks.all"
# 	],
# 	"daily": [
# 		"biztrack.tasks.daily"
# 	],
# 	"hourly": [
# 		"biztrack.tasks.hourly"
# 	],
# 	"weekly": [
# 		"biztrack.tasks.weekly"
# 	],
# 	"monthly": [
# 		"biztrack.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "biztrack.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "biztrack.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "biztrack.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["biztrack.utils.before_request"]
# after_request = ["biztrack.utils.after_request"]

# Job Events
# ----------
# before_job = ["biztrack.utils.before_job"]
# after_job = ["biztrack.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"biztrack.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

