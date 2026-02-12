// Copyright (c) 2025, Shivanand and contributors
// For license information, please see license.txt

frappe.query_reports["Application Tracking Report"] = {
    use_container_width: false,
    scroll_x: true,
    
    filters: [
        {
            fieldname: "employee",
            label: __("Employee Email"),
            fieldtype: "Link",
            options: "User",
        },
        {
            fieldname: "employee_name",
            label: __("Employee Name"),
            fieldtype: "Data",
            width: "100px"
        },
        {
            fieldname: "event_name",
            label: __("Event Name"),
            fieldtype: "Data",
            width: "100px"
        },
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
            width: "100px"
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            width: "100px"
        }
    ],
    
    "formatter": function(value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);
        
        // Format the Applications column to show as a badge if it's a number
        if (column.fieldname == "applications" && data && data.applications) {
            if (!isNaN(data.applications)) {
                let count = parseInt(data.applications);
                let color = count > 10 ? "red" : count > 5 ? "orange" : "green";
                value = `<span class="badge badge-${color}">${count}</span>`;
            }
        }
        
        // Format the duration column
        if (column.fieldname == "duration" && data && data.duration) {
            value = `<span style="color: #4CAF50; font-weight: bold;">${data.duration}</span>`;
        }
        
        // Format the new Name column (name1) with custom styling
        if (column.fieldname == "name1" && data && data.name1) {
            value = `<span style="color: #2196F3; font-weight: 500;">${data.name1}</span>`;
        }
        
        // Format the Application ID column
        if (column.fieldname == "application_id" && data && data.application_id) {
            value = `<span style="color: #FF9800; font-weight: 500;">${data.application_id}</span>`;
        }
        
        // Format the Event ID column
        if (column.fieldname == "event_id" && data && data.event_id) {
            value = `<span style="color: #9C27B0; font-weight: 500;">${data.event_id}</span>`;
        }
        
        // Format the Idle Duration column
        if (column.fieldname == "idle_duration" && data && data.idle_duration) {
            let duration = parseFloat(data.idle_duration);
            if (!isNaN(duration)) {
                // Format as decimal with 2 places and add styling
                value = `<span style="color: #FF5722; font-weight: 500;">${duration.toFixed(2)}</span>`;
            }
        }
        
        return value;
    },
    
    "onload": function(report) {
        // Add custom button to export data
        report.page.add_inner_button(__("Export to Excel"), function() {
            frappe.utils.csvify(report.data, report.columns, "Applications Tracking Report");
        });
        
        // Add refresh button
        report.page.add_inner_button(__("Refresh"), function() {
            report.refresh();
        });
    },
    
    "initial_depth": 0,
    "tree": false,
    "name_field": "name",
    "parent_field": "",
    "disable_prepared_report": false
};