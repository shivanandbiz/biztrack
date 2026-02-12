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

            <!-- Tab Navigation -->
            <div class="row" style="margin-top: 20px;">
                <div class="col-md-12">
                    <ul class="nav nav-tabs" id="dashboard-tabs">
                        <li class="active"><a data-tab="summary">Summary</a></li>
                        <li><a data-tab="window">Window</a></li>
                        <li><a data-tab="browser">Browser</a></li>
                        <!-- <li><a data-tab="editor">Editor</a></li> -->
                    </ul>
                </div>
            </div>

            <!-- Tab Content: Summary -->
            <div id="tab-summary" class="tab-content active" style="margin-top: 20px;">
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

                <!-- Hourly Chart -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="dashboard-section">
                            <h3>Hourly Activity</h3>
                            <div id="timeline_chart" style="height: 350px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Main Dashboard Sections -->
                <div class="row">
                    <div class="col-md-4">
                        <div class="dashboard-section">
                            <h3>Top Applications</h3>
                            <div id="top_applications_chart" style="height: 200px; margin-bottom: 15px;"></div>
                            <div id="top_applications_list"></div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="dashboard-section">
                            <h3>Category Distribution</h3>
                            <ul class="nav nav-tabs" id="category-tabs" style="margin-bottom: 15px; border-bottom: none;">
                                <li class="active"><a data-tab="cat-list" style="padding: 5px 10px; font-size: 12px;">List</a></li>
                                <li><a data-tab="cat-sunburst" style="padding: 5px 10px; font-size: 12px;">Sunburst</a></li>
                            </ul>
                            
                            <div id="cat-list-view">
                                <div id="category_list"></div>
                            </div>
                            
                            <div id="cat-sunburst-view" style="display: none; text-align: center;">
                                <div id="category_sunburst"></div>
                            </div>
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
            </div>

            <!-- Tab Content: Window -->
            <div id="tab-window" class="tab-content" style="margin-top: 20px; display: none;">
                <div class="row">
                    <div class="col-md-12">
                        <div class="dashboard-section">
                            <h3>Window Titles</h3>
                            <div class="row">
                                <div class="col-md-4">
                                    <div id="window_chart" style="height: 300px;"></div>
                                </div>
                                <div class="col-md-8">
                                    <div id="window_titles_list"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Content: Browser -->
            <div id="tab-browser" class="tab-content" style="margin-top: 20px; display: none;">
                <div class="row">
                    <div class="col-md-12">
                        <div class="dashboard-section">
                            <h3>Top Browser Domains</h3>
                            <div id="browser_domains_list">
                                <div class="text-center text-muted p-20">No browser data available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Common Section: Real-time Activity (Visible in all tabs) -->
            <div class="row" style="margin-top: 20px;">
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

        // Bind tab switching
        $('#dashboard-tabs a').on('click', (e) => {
            const tab = $(e.currentTarget).data('tab');

            // Update active tab styling
            $('#dashboard-tabs li').removeClass('active');
            $(e.currentTarget).parent().addClass('active');

            // Show/hide tab content
            $('.tab-content').hide();
            $(`#tab-${tab}`).show();
        });
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

        // Fetch hourly activity for the selected date
        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_hourly_activity',
            args: {
                date: selected_date,
                employee: employee
            },
            callback: (r) => {
                if (r.message) {
                    this.render_hourly_chart(r.message);
                }
            }
        });

        // Fetch browser domains for the selected date
        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_browser_domains',
            args: {
                date: selected_date,
                employee: employee
            },
            callback: (r) => {
                if (r.message) {
                    this.render_browser_domains(r.message);
                } else {
                    $('#browser_domains_list').html('<div class="text-center text-muted p-20">No browser data available</div>');
                }
            }
        });

        // Fetch category hierarchy
        frappe.call({
            method: 'biztrack.biztrack.page.activity_dashboard.activity_dashboard.get_category_hierarchy',
            args: {
                date: selected_date,
                employee: employee
            },
            callback: (r) => {
                if (r.message) {
                    this.render_category_sunburst(r.message);
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

        // Render category visualizations (handled by sunburst method which manages tabs)
        // We'll call render_category_list from within render_category_sunburst for initial load
        // But we need the list data, so we'll use top_categories for now
        this.render_category_list(data.top_categories);

        this.render_employee_activity(data.employee_activity);
        // this.render_employee_activity(data.employee_activity);
        // this.render_timeline(data.daily_activity); // Replaced by hourly chart
        this.render_window_titles(data.window_titles);
    }

    render_category_list(categories) {
        if (!categories || categories.length === 0) {
            $('#category_list').html('<div class="text-center text-muted">No category data</div>');
            return;
        }

        const maxTime = Math.max(...categories.map(c => c.total_time));

        const html = categories.map(c => {
            const width = (c.total_time / maxTime) * 100;
            return `
                <div class="progress-item" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 2px;">
                        <span style="font-weight: 500;">${c.category}</span>
                        <span style="color: #666;">${this.format_time(c.total_time)}</span>
                    </div>
                    <div class="progress" style="height: 6px; margin-bottom: 0;">
                        <div class="progress-bar progress-bar-info" role="progressbar" 
                             style="width: ${width}%">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        $('#category_list').html(html);
    }

    render_browser_domains(domains) {
        if (!domains || domains.length === 0) {
            $('#browser_domains_list').html('<div class="text-center text-muted p-20">No browser data available</div>');
            return;
        }

        const html = domains.map(d => {
            // Create page list
            const pagesHtml = d.pages.map(p => `
                <div style="font-size: 11px; margin-left: 32px; color: #666; border-left: 2px solid #eee; padding-left: 8px; margin-top: 2px; display: flex; justify-content: space-between;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;" title="${p.title}">${p.title}</span>
                    <span>${this.format_time(p.time)}</span>
                </div>
            `).join('');

            return `
                <div class="domain-item" style="padding: 10px; border-bottom: 1px solid #f1f1f1;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; flex: 1;">
                            <img src="${d.icon}" width="20" height="20" style="margin-right: 12px; border-radius: 4px;" onerror="this.src='https://www.google.com/s2/favicons?domain=example.com'">
                            <div style="font-weight: 500; font-size: 14px; color: #2c3e50;">${d.domain}</div>
                        </div>
                        <div style="font-weight: bold; color: #2980b9;">${this.format_time(d.total_time)}</div>
                    </div>
                    <div style="margin-top: 5px;">
                        ${pagesHtml}
                    </div>
                </div>
            `;
        }).join('');

        $('#browser_domains_list').html(html);
    }

    render_category_sunburst(data) {
        if (!data || !data.children || data.children.length === 0) {
            $('#category_sunburst').html('<div class="text-center text-muted">No category data</div>');
            return;
        }

        // Initialize category tabs if not already done
        if (!$('#category-tabs').data('init')) {
            $('#category-tabs a').on('click', (e) => {
                const tab = $(e.currentTarget).data('tab');

                // Update active tab styling
                $('#category-tabs li').removeClass('active');
                $(e.currentTarget).parent().addClass('active');

                if (tab === 'cat-list') {
                    $('#cat-list-view').show();
                    $('#cat-sunburst-view').hide();
                } else {
                    $('#cat-list-view').hide();
                    $('#cat-sunburst-view').show();
                }
            });
            $('#category-tabs').data('init', true);
        }

        const width = 250;
        const height = 250;
        const radius = Math.min(width, height) / 2;
        const colorPalette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

        // Recursive function to flatten hierarchy into arcs
        let arcs = [];
        let totalValue = data.children.reduce((sum, c) => sum + c.value, 0);

        // Simple 2-level sunburst implementation using SVG
        // Level 1: Inner circle
        let currentAngle = 0;

        data.children.sort((a, b) => b.value - a.value).forEach((node, i) => {
            const angle = (node.value / totalValue) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            const color = colorPalette[i % colorPalette.length];

            // Level 1 Arc (Inner)
            arcs.push({
                path: this.calculateArc(0, radius * 0.6, startAngle, endAngle),
                color: color,
                title: `${node.name}: ${this.format_time(node.value)}`
            });

            // Level 2 Arcs (Outer)
            if (node.children && node.children.length > 0) {
                let currentSubAngle = startAngle;
                // Normalize sub-children values to fit parent's angle slice
                let subTotal = node.children.reduce((sum, c) => sum + c.value, 0);

                // If subTotal is 0 or mismatch, use parent value
                if (subTotal === 0) subTotal = node.value;

                node.children.forEach((subNode, j) => {
                    // Calculate proportion relative to PARENT value
                    const subAngle = (subNode.value / subTotal) * angle;

                    const subStart = currentSubAngle;
                    const subEnd = currentSubAngle + subAngle;

                    // Lighter shade of parent color
                    arcs.push({
                        path: this.calculateArc(radius * 0.62, radius, subStart, subEnd),
                        color: this.adjustColorOpacity(color, 0.7 - (j * 0.1)),
                        title: `${subNode.name}: ${this.format_time(subNode.value)}`
                    });

                    currentSubAngle += subAngle;
                });
            } else {
                // If no children, extend parent color to outer rim
                arcs.push({
                    path: this.calculateArc(radius * 0.62, radius, startAngle, endAngle),
                    color: this.adjustColorOpacity(color, 0.7),
                    title: `${node.name} (details): ${this.format_time(node.value)}`
                });
            }

            currentAngle += angle;
        });

        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <g transform="translate(${width / 2}, ${height / 2})">
                    ${arcs.map(arc => `<path d="${arc.path}" fill="${arc.color}" stroke="white" stroke-width="1"><title>${arc.title}</title></path>`).join('')}
                    <circle r="${radius * 0.25}" fill="white" />
                    <text text-anchor="middle" dy="5" font-size="10" font-weight="bold" fill="#666">Total</text>
                </g>
            </svg>
        `;

        $('#category_sunburst').html(svg);
    }

    calculateArc(innerRadius, outerRadius, startAngle, endAngle) {
        // SVG Arc calculation
        const x1 = Math.cos(startAngle - Math.PI / 2) * outerRadius;
        const y1 = Math.sin(startAngle - Math.PI / 2) * outerRadius;
        const x2 = Math.cos(endAngle - Math.PI / 2) * outerRadius;
        const y2 = Math.sin(endAngle - Math.PI / 2) * outerRadius;

        const x3 = Math.cos(endAngle - Math.PI / 2) * innerRadius;
        const y3 = Math.sin(endAngle - Math.PI / 2) * innerRadius;
        const x4 = Math.cos(startAngle - Math.PI / 2) * innerRadius;
        const y4 = Math.sin(startAngle - Math.PI / 2) * innerRadius;

        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

        if (innerRadius === 0) {
            // Sector
            return [
                'M', 0, 0,
                'L', x1, y1,
                'A', outerRadius, outerRadius, 0, largeArc, 1, x2, y2,
                'Z'
            ].join(' ');
        } else {
            // Annular Sector
            return [
                'M', x4, y4,
                'L', x1, y1,
                'A', outerRadius, outerRadius, 0, largeArc, 1, x2, y2,
                'L', x3, y3,
                'A', innerRadius, innerRadius, 0, largeArc, 0, x4, y4,
                'Z'
            ].join(' ');
        }
    }

    adjustColorOpacity(hex, opacity) {
        // Simple hex to rgba
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
        } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
        // Render Pie Chart
        this.render_pie_chart('top_applications_chart', applications.map(app => ({
            name: app.applications,
            value: app.total_time
        })), { donut: false });

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
        // Render Donut Chart for Window Titles
        // Group small values into "Others" for chart clarity
        let chartData = titles.map(t => ({
            name: t.window_title,
            value: t.total_time
        }));

        if (chartData.length > 8) {
            const top8 = chartData.slice(0, 8);
            const others = chartData.slice(8).reduce((sum, item) => sum + item.value, 0);
            chartData = [...top8, { name: 'Others', value: others }];
        }

        this.render_pie_chart('window_chart', chartData, { donut: true, donutWidth: 50 });

        const html = titles.map(title => `
            <div class="window-item">
                <div class="window-title">${title.window_title}</div>
                <div class="window-app">${title.applications}</div>
                <div class="window-time">${this.format_time(title.total_time)}</div>
            </div>
        `).join('');

        $('#window_titles_list').html(html);
    }

    render_pie_chart(containerId, data, options = {}) {
        const container = $(`#${containerId}`);
        if (container.length === 0 || !data || data.length === 0) return;

        const width = container.width() || 300;
        const height = container.height() || 300;
        const radius = Math.min(width, height) / 2 - 10;
        const donutWidth = options.donutWidth || 0;
        const innerRadius = options.donut ? radius - donutWidth : 0;

        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];

        const total = data.reduce((sum, d) => sum + d.value, 0);
        let currentAngle = 0;

        const slicesHtml = data.map((d, i) => {
            const angle = (d.value / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            // Should skip if angle is too small
            if (angle < 0.01) return '';

            const largeArc = angle > Math.PI ? 1 : 0;

            const x1 = Math.cos(startAngle - Math.PI / 2) * radius;
            const y1 = Math.sin(startAngle - Math.PI / 2) * radius;
            const x2 = Math.cos(endAngle - Math.PI / 2) * radius;
            const y2 = Math.sin(endAngle - Math.PI / 2) * radius;

            let path = '';

            if (options.donut) {
                const x3 = Math.cos(endAngle - Math.PI / 2) * innerRadius;
                const y3 = Math.sin(endAngle - Math.PI / 2) * innerRadius;
                const x4 = Math.cos(startAngle - Math.PI / 2) * innerRadius;
                const y4 = Math.sin(startAngle - Math.PI / 2) * innerRadius;

                path = [
                    'M', x4, y4,
                    'L', x1, y1,
                    'A', radius, radius, 0, largeArc, 1, x2, y2,
                    'L', x3, y3,
                    'A', innerRadius, innerRadius, 0, largeArc, 0, x4, y4,
                    'Z'
                ].join(' ');
            } else {
                path = [
                    'M', 0, 0,
                    'L', x1, y1,
                    'A', radius, radius, 0, largeArc, 1, x2, y2,
                    'Z'
                ].join(' ');
            }

            const color = d.name === 'Others' ? '#e0e0e0' : colors[i % colors.length];
            const percent = ((d.value / total) * 100).toFixed(1);

            return `
                <path d="${path}" fill="${color}" stroke="white" stroke-width="1">
                    <title>${d.name}: ${this.format_time(d.value)} (${percent}%)</title>
                </path>
            `;
        }).join('');

        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; margin: 0 auto;">
                <g transform="translate(${width / 2}, ${height / 2})">
                    ${slicesHtml}
                </g>
            </svg>
        `;

        container.html(svg);
    }

    render_hourly_chart(hourly_data) {
        if (!hourly_data || hourly_data.length === 0) {
            $('#timeline_chart').html('<div class="text-center text-muted p-20">No data available for this day</div>');
            return;
        }

        const width = 800;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Find max duration to scale Y axis
        const maxDuration = Math.max(...hourly_data.map(d => d.total_time), 1); // Avoid div by zero

        // Calculate bar width
        const barWidth = chartWidth / 24;
        const barPadding = 5;

        // Generate bars
        let barsHtml = '';
        let labelsHtml = '';
        let gridHtml = '';

        // Y-axis grid lines (5 lines)
        for (let i = 0; i <= 5; i++) {
            const y = chartHeight - (chartHeight * (i / 5));
            const value = (maxDuration * (i / 5));
            const timeLabel = this.format_time(value);

            gridHtml += `
                <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="4" />
                <text x="-10" y="${y + 4}" text-anchor="end" font-size="10" fill="#666">${timeLabel}</text>
            `;
        }

        hourly_data.forEach((data, index) => {
            const hour = data.hour;
            const height = (data.total_time / maxDuration) * chartHeight;
            const x = index * barWidth;
            const y = chartHeight - height;

            // Color based on intensity relative to max
            const intensity = data.total_time / maxDuration;
            const color = `rgba(52, 152, 219, ${0.3 + (intensity * 0.7)})`;

            // Tooltip text
            const tooltip = `Hour: ${hour}:00 - ${hour + 1}:00\nTime: ${this.format_time(data.total_time)}\nSessions: ${data.session_count}\nApps: ${data.unique_apps}`;

            barsHtml += `
                <rect class="hour-bar" 
                      x="${x + barPadding}" 
                      y="${y}" 
                      width="${barWidth - (barPadding * 2)}" 
                      height="${height}" 
                      fill="${color}" 
                      rx="2">
                    <title>${tooltip}</title>
                </rect>
            `;

            // X-axis labels (every 3 hours)
            if (hour % 3 === 0) {
                labelsHtml += `
                    <text x="${x + (barWidth / 2)}" y="${chartHeight + 20}" text-anchor="middle" font-size="10" fill="#666">
                        ${hour}:00
                    </text>
                `;
            }
        });

        const svg = `
            <div style="overflow-x: auto;">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; margin: 0 auto;">
                    <g transform="translate(${margin.left}, ${margin.top})">
                        <!-- Grid and Axes -->
                        ${gridHtml}
                        <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#ccc" />
                        <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="#ccc" />
                        
                        <!-- Data -->
                        ${barsHtml}
                        ${labelsHtml}
                        
                        <!-- Axis Titles -->
                        <text x="${chartWidth / 2}" y="${chartHeight + 35}" text-anchor="middle" font-size="12" fill="#333">Time of Day (Hour)</text>
                    </g>
                </svg>
            </div>
        `;

        $('#timeline_chart').html(svg);
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