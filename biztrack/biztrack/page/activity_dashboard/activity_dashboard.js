//activity_dashboard.js

frappe.pages['activity-dashboard'].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Activity Dashboard',
        single_column: true
    });

    // Load CSS
    frappe.require('/assets/biztrack/css/activity_dashboard.css');

    // Initialize dashboard
    new ActivityDashboard(page);
};

class ActivityDashboard {
    constructor(page) {
        this.page = page;
        this.wrapper = page.main;
        this.init();
    }

    init() {
        this.setup_page();
        this.setup_auto_refresh();
        this.load_employees();
        this.load_dashboard_data();
    }

    setup_page() {
        // Fixed: Use direct HTML instead of template rendering to avoid syntax errors
        const html = `
        <div class="activity-dashboard" style="border: 2px solid #003366; padding: 15px; border-radius: 8px; position: relative; z-index: 1; background-color: #ffffff;">
            <div class="row">
                <div class="col-md-12">
                    <div class="page-header">
                        <h2>BizTracker Activity Dashboard</h2>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                            <div class="col-md-3">
                                <label for="employee">Employee:</label>
                                <select id="employee" class="form-control">
                                    <option value="">All Employees</option>
                                </select>
                            </div>
                            <div class="date-navigation" style="display: flex; align-items: center; gap: 10px;">
                                <button class="btn btn-default btn-sm" id="prev_day" title="Previous Day">
                                    <i class="fa fa-chevron-left"></i>
                                </button>
                                <input type="date" id="selected_date" class="form-control" style="width: 180px;">
                                <button class="btn btn-default btn-sm" id="next_day" title="Next Day">
                                    <i class="fa fa-chevron-right"></i>
                                </button>
                                <button class="btn btn-primary btn-sm" id="today_btn">Today</button>
                                <button class="btn btn-success btn-sm" id="refresh_btn">
                                    <i class="fa fa-refresh"></i> Refresh
                                </button>
                            </div>
                            <div class="time-active-display" style="text-align: right;">
                                <small style="color: #666;">Time active:</small>
                                <div id="time_active" style="font-size: 18px; font-weight: bold; color: #2c3e50;">0h 0m</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="row dashboard-summary">
                <div class="col-md-3">
                    <div class="summary-card">
                        <h4>Total Time</h4>
                        <div class="summary-value" id="total_time">0h 0m</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-card">
                        <h4>Active Sessions</h4>
                        <div class="summary-value" id="active_sessions">0</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-card">
                        <h4>Applications Used</h4>
                        <div class="summary-value" id="unique_apps">0</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="summary-card">
                        <h4>Average Session</h4>
                        <div class="summary-value" id="avg_session">0m</div>
                    </div>
                </div>
            </div>

            <!-- Main Dashboard Sections -->
            <div class="row">
                <div class="col-md-4">
                    <div class="dashboard-section">
                        <h3>Top Applications</h3>
                        <div id="top_applications_chart"></div>
                        <div id="top_applications_list"></div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="dashboard-section">
                        <h3>Top Categories</h3>
                        <div id="category_chart"></div>
                        <div id="category_list"></div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="dashboard-section">
                        <h3>Employee Activity</h3>
                        <div id="employee_chart"></div>
                        <div id="employee_list"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="dashboard-section">
                        <h3>Daily Activity Timeline</h3>
                        <div id="timeline_chart" style="height: 400px;"></div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="dashboard-section">
                        <h3>Window Titles</h3>
                        <div id="window_titles_list"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <div class="dashboard-section">
                        <h3>Real-time Activity</h3>
                        <div id="realtime_activity"></div>
                    </div>
                </div>
            </div>
        </div>
        `;

        $(this.wrapper).html(html);

        // Set default date to today
        const today = frappe.datetime.get_today();
        $('#selected_date').val(today);

        // Bind navigation buttons
        $('#prev_day').on('click', () => this.navigate_date(-1));
        $('#next_day').on('click', () => this.navigate_date(1));
        $('#today_btn').on('click', () => this.navigate_to_today());
        $('#refresh_btn').on('click', () => this.load_dashboard_data());

        // Bind date change event
        $('#selected_date').on('change', () => this.load_dashboard_data());

        // Bind employee change event
        $('#employee').on('change', () => this.load_dashboard_data());
    }


    navigate_date(days) {
        const current_date = $('#selected_date').val();
        const new_date = frappe.datetime.add_days(current_date, days);
        $('#selected_date').val(new_date);
        this.load_dashboard_data();
    }

    navigate_to_today() {
        const today = frappe.datetime.get_today();
        $('#selected_date').val(today);
        this.load_dashboard_data();
    }

    setup_auto_refresh() {
        // Auto-refresh dashboard summary every 5 minutes
        setInterval(() => {
            this.load_dashboard_data();
        }, 300000);

        // Auto-refresh real-time activity every 30 seconds
        setInterval(() => {
            const employee = $('#employee').val();
            frappe.call({
                method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_real_time_activity',
                args: {
                    employee: employee
                },
                callback: (r) => {
                    if (r.message) {
                        this.render_realtime_activity(r.message);
                    }
                }
            });
        }, 30000);  // 30 seconds
    }

    load_employees() {
        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_employees',
            callback: (r) => {
                if (r.message) {
                    let options = '<option value="">All Employees</option>';
                    r.message.forEach(emp => {
                        options += `<option value="${emp.employee}">${emp.employee_name}</option>`;
                    });
                    $('#employee').html(options);
                }
            }
        });
    }


    load_dashboard_data() {
        const selected_date = $('#selected_date').val();
        const employee = $('#employee').val();

        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_activity_summary',
            args: {
                date: selected_date,
                employee: employee
            },
            callback: (r) => {
                if (r.message) {
                    this.render_dashboard(r.message);
                }
            }
        });

        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_real_time_activity',
            args: {
                employee: employee
            },
            callback: (r) => {
                if (r.message) {
                    this.render_realtime_activity(r.message);
                }
            }
        });
    }


    render_dashboard(data) {
        this.render_summary_cards(data);
        this.render_top_applications(data.top_applications);
        this.render_category_breakdown(data.top_categories);
        this.render_employee_activity(data.employee_activity);
        this.render_timeline(data.daily_activity);
        this.render_window_titles(data.window_titles);
    }

    render_summary_cards(data) {
        const total_time = data.top_applications.reduce((sum, app) => sum + app.total_time, 0);
        const total_sessions = data.top_applications.reduce((sum, app) => sum + app.session_count, 0);
        const unique_apps = data.top_applications.length;
        const avg_session = total_sessions > 0 ? total_time / total_sessions : 0;

        $('#total_time').text(this.format_time(total_time));
        $('#time_active').text(this.format_time(total_time)); // Also update time active display
        $('#active_sessions').text(total_sessions);
        $('#unique_apps').text(unique_apps);
        $('#avg_session').text(this.format_time(avg_session));
    }

    render_top_applications(applications) {
        const colors = ['#d1f2eb', '#d6eaf8', '#e8daef', '#fdebd0', '#f5b7b1', '#d5f5e3', '#fcf3cf']; // Light shades

        const html = applications.map((app, index) => {
            const color = colors[index % colors.length];
            return `
                <div class="app-item" style="background-color: ${color}; color: #333; padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #ccc;">
                    <div class="app-name" style="font-weight: bold;">${app.applications}</div>
                    <div class="app-time">${this.format_time(app.total_time)}</div>
                    <div class="app-sessions">${app.session_count} sessions</div>
                </div>
            `;
        }).join('');

        $('#top_applications_list').html(html);
    }

    render_category_breakdown(categories) {
        const html = categories.map(cat => `
            <div class="category-item">
                <div class="category-name">${cat.category || 'Uncategorized'}</div>
                <div class="category-time">${this.format_time(cat.total_time)}</div>
                <div class="category-sessions">${cat.session_count} sessions</div>
            </div>
        `).join('');

        $('#category_list').html(html);
    }

    render_employee_activity(employees) {
        const html = employees.map(emp => `
            <div class="employee-item">
                <div class="employee-name">${emp.employee_name}</div>
                <div class="employee-time">${this.format_time(emp.total_time)}</div>
                <div class="employee-apps">${emp.unique_apps} apps</div>
            </div>
        `).join('');

        $('#employee_list').html(html);
    }

    render_window_titles(titles) {
        const html = titles.map(title => `
            <div class="window-item">
                <div class="window-title">${title.window_title}</div>
                <div class="window-app">${title.applications}</div>
                <div class="window-time">${this.format_time(title.total_time)}</div>
            </div>
        `).join('');

        $('#window_titles_list').html(html);
    }

    render_timeline(daily_activity) {
        if (!daily_activity || daily_activity.length === 0) {
            $('#timeline_chart').html('<div class="text-center text-muted">No data available</div>');
            return;
        }

        // Prepare data for pie chart
        const pieData = daily_activity.map(day => ({
            name: frappe.datetime.str_to_user(day.date),
            value: day.total_time,
            sessions: day.session_count
        }));

        // Generate colors for pie slices
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85D4E6', '#F4D03F'
        ];

        // Create SVG
        const width = 400;
        const height = 250;
        const radius = Math.min(width, height) / 2 - 40;

        const svg = `
            <svg width="${width}" height="${height}" style="margin: 20px auto; display: block;">
                <g transform="translate(${width / 2}, ${height / 2})">
                    ${this.createPieSlices(pieData, radius, colors)}
                </g>
            </svg>
            <div class="timeline-legend" style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 15px;">
                ${this.createLegend(pieData, colors)}
            </div>
        `;

        $('#timeline_chart').html(svg);
    }

    createPieSlices(data, radius, colors) {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        let currentAngle = 0;

        return data.map((d, i) => {
            const angle = (d.value / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            // Calculate arc path
            const x1 = Math.cos(startAngle) * radius;
            const y1 = Math.sin(startAngle) * radius;
            const x2 = Math.cos(endAngle) * radius;
            const y2 = Math.sin(endAngle) * radius;

            const largeArc = angle > Math.PI ? 1 : 0;

            const pathData = [
                'M', 0, 0,
                'L', x1, y1,
                'A', radius, radius, 0, largeArc, 1, x2, y2,
                'Z'
            ].join(' ');

            currentAngle += angle;

            const color = colors[i % colors.length];
            const percentage = ((d.value / total) * 100).toFixed(1);

            return `
                <path d="${pathData}" 
                      fill="${color}" 
                      stroke="white" 
                      stroke-width="2"
                      style="cursor: pointer;">
                    <title>${d.name}: ${this.format_time(d.value)} (${percentage}%) - ${d.sessions} sessions</title>
                </path>
            `;
        }).join('');
    }

    createLegend(data, colors) {
        return data.map((d, i) => {
            const color = colors[i % colors.length];
            return `
                <div style="display: flex; align-items: center; margin: 5px 10px; font-size: 12px;">
                    <div style="width: 15px; height: 15px; background-color: ${color}; margin-right: 8px; border-radius: 3px;"></div>
                    <span style="white-space: nowrap;">${d.name} (${this.format_time(d.value)})</span>
                </div>
            `;
        }).join('');
    }

    render_realtime_activity(activities) {
        const pastelColors = [
            '#fef6e4',  // Light Cream
            '#e0f7fa',  // Light Aqua
            '#f3e5f5',  // Lavender
            '#fff3e0',  // Peach
            '#e8f5e9',  // Mint
            '#e3f2fd',  // Baby Blue
            '#f9fbe7',  // Lemon Tint
        ];

        const html = activities.map((activity, index) => {
            const color = pastelColors[index % pastelColors.length];
            return `
                <div class="realtime-item" style="background-color: ${color}; color: #333; padding: 12px; border-radius: 10px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div class="activity-time" style="font-weight: bold; color: #555;">
                            ${frappe.datetime.get_time(activity.creation)}
                        </div>
                        <div class="activity-user" style="color: #666;">
                            ${activity.employee_name}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 6px;">
                        <strong>Application:</strong> ${activity.applications}
                    </div>
                    
                    <div style="margin-bottom: 6px;">
                        <strong>Category:</strong> ${activity.category || 'N/A'}
                    </div>
                    
                    <div style="margin-bottom: 6px;">
                        <strong>Event:</strong> ${activity.event_name} (${activity.event_id})
                    </div>
                    
                    ${activity.window_title ? `
                        <div style="margin-bottom: 6px; font-style: italic; color: #555;">
                            <strong>Window:</strong> ${activity.window_title}
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                        <div class="activity-duration" style="font-weight: bold; color: #2196F3;">
                            Duration: ${this.format_time(activity.duration)}
                        </div>
                        <div class="activity-idle" style="color: #999;">
                            Idle: ${this.format_time(activity.idle_duration)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        $('#realtime_activity').html(html);
    }


    format_time(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}