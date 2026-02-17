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
        // HTML is loaded automatically from activity_dashboard.html
        // We just need to ensure the container is ready
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
        this.render_employee_activity(summary.employee_activity);
    }

    render_summary_cards(data) {
        let total_seconds = 0;
        let total_sessions = 0;
        let unique_apps = new Set();

        // Aggregate data from top_applications (or could come partly from employee_activity)
        // Since summary doesn't return grand totals directly, we calculate from available lists
        // Note: Ideally backend should return grand totals. Using employee_activity for totals is safer.

        if (data.employee_activity) {
            data.employee_activity.forEach(emp => {
                total_seconds += (emp.total_seconds || 0);
                total_sessions += (emp.session_count || 0);
            });
        }

        // For unique apps count
        if (data.top_applications) {
            data.top_applications.forEach(app => unique_apps.add(app.application_id));
        }

        $('#stat-total-time').text(this.format_seconds_to_time(total_seconds));
        $('#stat-sessions').text(total_sessions);
        $('#stat-apps').text(data.top_applications ? data.top_applications.length : 0); // Approx

        const avg_seconds = total_sessions > 0 ? Math.round(total_seconds / total_sessions) : 0;
        $('#stat-avg-session').text(this.format_seconds_to_time(avg_seconds));
    }

    render_hourly_chart(hourly_data) {
        if (!hourly_data) return;

        const labels = hourly_data.map(h => `${h.hour}:00`);
        const values = hourly_data.map(h => (h.total_seconds || 0) / 3600); // In Hours

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
            title: "Hourly Activity (Hours)",
            type: 'bar',
            height: 250,
            colors: ['#2196F3']
        });
    }

    render_top_apps(apps) {
        if (!apps) return;

        // Chart
        const labels = apps.map(a => a.application_id.substring(0, 15)); // Truncate
        const values = apps.map(a => (a.total_seconds || 0) / 3600); // In Hours

        new frappe.Chart("#top-apps-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Hours",
                        chartType: "pie",
                        values: values
                    }
                ]
            },
            type: 'pie',
            height: 250,
            colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800']
        });

        // Table
        const tbody = $('#top-apps-list tbody');
        tbody.empty();

        const total = apps.reduce((sum, a) => sum + (a.total_seconds || 0), 0);

        apps.forEach(app => {
            const percentage = total > 0 ? Math.round((app.total_seconds / total) * 100) : 0;
            const appName = app.applications || app.application_id || 'Unknown';
            const row = `
                <tr>
                    <td>${appName}</td>
                    <td class="text-right">${app.total_time}</td>
                    <td class="text-right">${percentage}%</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    render_employee_activity(employees) {
        if (!employees) return;

        // Chart
        const labels = employees.map(e => e.employee_name || e.employee);
        const values = employees.map(e => (e.total_seconds || 0) / 3600);

        new frappe.Chart("#employee-chart", {
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Hours",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            type: 'bar',
            height: 250,
            colors: ['#673AB7']
        });

        // Table
        const tbody = $('#employee-list-stats tbody');
        tbody.empty();

        employees.forEach(emp => {
            const row = `
                <tr>
                    <td>${emp.employee_name || emp.employee}</td>
                    <td class="text-right">${emp.total_time}</td>
                    <td class="text-right">${emp.unique_apps || 0}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    format_seconds_to_time(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds === null) return "00:00:00";

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }
}