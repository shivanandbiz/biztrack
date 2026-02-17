// activity_dashboard.js

frappe.pages['activity-dashboard'].on_page_load = function (wrapper) {
    new ActivityDashboard(wrapper);
};

class ActivityDashboard {
    constructor(wrapper) {
        this.wrapper = wrapper;
        this.page = frappe.ui.make_app_page({
            parent: wrapper,
            title: 'Activity Dashboard',
            single_column: true
        });

        this.setup_ui();
        this.bind_events();
        this.load_initial_data();
    }

    setup_ui() {
        // Render the HTML template into the page body
        $(frappe.render_template('activity_dashboard', this)).appendTo(this.page.main);

        this.today = frappe.datetime.get_today();
        $('#date-filter').val(this.today);
    }

    bind_events() {
        const me = this;

        $('#refresh-btn').on('click', () => this.refresh_data());
        $('#today-btn').on('click', () => {
            $('#date-filter').val(this.today);
            this.refresh_data();
        });

        $('#employee-filter, #date-filter').on('change', () => this.refresh_data());
    }

    async load_initial_data() {
        // Load employees for filter
        const employees = await frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_employees'
        });

        if (employees.message) {
            const select = $('#employee-filter');
            employees.message.forEach(emp => {
                select.append(`<option value="${emp.employee}">${emp.employee_name || emp.employee}</option>`);
            });
        }

        this.refresh_data();
    }

    async refresh_data() {
        const date = $('#date-filter').val();
        const employee = $('#employee-filter').val();

        frappe.show_progress('Loading Dashboard', 30, 100, 'Please wait');

        try {
            // Fetch Activity Summary
            const summary = await frappe.call({
                method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_activity_summary',
                args: { date, employee }
            });

            // Fetch Hourly Activity
            const hourly = await frappe.call({
                method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_hourly_activity',
                args: { date, employee }
            });

            this.render_dashboard(summary.message, hourly.message);
            frappe.hide_progress();

        } catch (err) {
            console.error(err);
            frappe.hide_progress();
            frappe.msgprint('Error loading dashboard data');
        }
    }

    render_dashboard(summary, hourly) {
        if (!summary) return;

        this.render_summary_cards(summary);
        this.render_hourly_chart(hourly);
        this.render_top_apps(summary.top_applications);
        this.render_categories(summary.top_categories);
        this.render_window_titles(summary.window_titles);
        this.render_employee_app_usage(summary.employee_app_usage);
        // this.render_employee_activity(summary.employee_activity); // Optional, can keep if needed
    }

    render_summary_cards(data) {
        let total_seconds = 0;
        let total_sessions = 0;
        let unique_apps = new Set();

        if (data.employee_activity) {
            data.employee_activity.forEach(emp => {
                total_seconds += (emp.total_seconds || 0);
                total_sessions += (emp.session_count || 0);
            });
        }

        if (data.top_applications) {
            data.top_applications.forEach(app => unique_apps.add(app.application_id));
        }

        $('#stat-total-time').text(this.format_aw_time_string(total_seconds));
        $('#stat-sessions').text(total_sessions);
        $('#stat-apps').text(data.top_applications ? data.top_applications.length : 0);

        const avg_seconds = total_sessions > 0 ? Math.round(total_seconds / total_sessions) : 0;
        $('#stat-avg-session').text(this.format_aw_time_string(avg_seconds));
    }

    render_hourly_chart(hourly_data) {
        if (!hourly_data) return;

        const labels = hourly_data.map(h => `${h.hour}:00`);
        const values = hourly_data.map(h => (h.total_seconds || 0) / 3600);

        new frappe.Chart("#hourly-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Activity (Hours)",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            title: "Hourly Activity",
            type: 'bar',
            height: 250,
            colors: ['#2196F3']
        });
    }

    /**
     * Renders a list of items with progress bars (ActivityWatch Style)
     */
    render_aw_list(data, containerId, labelKey, timeKey, valueKey, subLabelKey) {
        const container = $(containerId);
        container.empty();

        if (!data || data.length === 0) {
            container.append('<div class="text-muted text-center p-3">No activity found</div>');
            return;
        }

        const maxVal = Math.max(...data.map(d => d[valueKey] || 0));

        // Colors similar to ActivityWatch palette
        const colors = [
            '#ffb74d', '#64b5f6', '#81c784', '#ffd54f', '#4db6ac',
            '#ba68c8', '#e57373', '#90a4ae', '#a1887f', '#ff8a65'
        ];

        data.forEach((item, index) => {
            const val = item[valueKey] || 0;
            const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const label = item[labelKey] || 'Unknown';

            // Use local formatter for "1h 2m 3s" style instead of backend string
            const time = this.format_aw_time_string(val);

            const subLabel = subLabelKey ? (item[subLabelKey] || '') : '';
            const color = colors[index % colors.length];

            const html = `
                <div class="aw-list-item">
                    <div class="aw-bar" style="width: ${percent}%; background-color: ${color};"></div>
                    <div class="aw-content">
                        <div style="width: 100%; overflow: hidden;">
                             <div class="aw-label" title="${label}">${label}</div>
                             ${subLabel ? `<div class="aw-sublabel" title="${subLabel}">${subLabel}</div>` : ''}
                        </div>
                        <div class="aw-time">${time}</div>
                    </div>
                </div>
            `;
            container.append(html);
        });
    }

    format_seconds_to_time(totalSeconds) {
        // Kept for charts tooltips if needed, or can replace too
        return this.format_aw_time_string(totalSeconds);
    }

    format_aw_time_string(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds === null) return "0s";

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        let timeParts = [];
        if (hours > 0) timeParts.push(`${hours}h`);
        if (minutes > 0) timeParts.push(`${minutes}m`);
        if (seconds > 0 || timeParts.length === 0) timeParts.push(`${seconds}s`);

        return timeParts.join(' ');
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }
}