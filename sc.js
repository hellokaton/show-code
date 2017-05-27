var ShowCode = {
    repoApiUrl: 'https://api.github.com/users/$1/repos',
    config: {}
};

ShowCode.init = function (config) {
    this.config = config;
    this.type = config.type || 'repo';
    this.config.repos = config.repos || [];
    this.config.sort = config.sort || 'pushed';
    this.config.direction = config.direction || 'desc';
    this.config.loadtext = config.loadtext || '加载中...';
    this.config.user = config.user || 'biezhi';
};

ShowCode.apply = function (config) {
    this.init(config);

    $(this.config.el).html("<span><span class='fa fa-refresh fa-spin'></span> " + this.config.loadtext + "</span>");

    var githubHtml = localStorage.aboutPageGithubHtml || "";
    var timeDiff = Math.round(($.now() - parseInt(localStorage.aboutPageLastRequest || 0)) / 60000); // minutes from last request

    // if githubHtml is not empty and last request time < 15 minutes, load the cache.
    // if (githubHtml != "" && timeDiff < 15) {
    //     this.showRepos(githubHtml);
    //     console.log("Load github project cache saved " + timeDiff + " minutes ago.");
    //     return;
    // }

    this.config.apiUrl = this.repoApiUrl.replace('$1', (this.config.user || 'biezhi')) +
        '?sort=' + this.config.sort + '&direction=' + this.config.direction;

    console.log("request url => " + this.config.apiUrl);

    var _this = this;

    // 发起请求
    fetch(this.config.apiUrl).then(function (res) {
        return res.json();
    }).then(function (data) {
        // console.log(JSON.stringify(data));
        githubHtml = _this.createReposTable(data, _this.config.repos);
        // save cache
        localStorage.aboutPageGithubHtml = githubHtml;
        localStorage.aboutPageLastRequest = $.now();
        // display repos info
        _this.showRepos(githubHtml);
    }).catch(function () {
        var error = "<span class='text-danger'>" +
            "<span class='fa fa-warning'></span> 获取 github 项目信息出错，请稍后" +
            "<a href='' onclick='createReposHtml();return false;'>刷新</a>重试。</span>";

        // if cache is too old (saved 6 hours ago), show error
        if (timeDiff > 360 || githubHtml == "") {
            $(el).html(error);
        } else {
            _this.showRepos(githubHtml);
            console.warn("Could not fetch " + apiurl + ", load cache saved " + timeDiff + " minutes ago.");
        }
    });
};

ShowCode.showRepos = function (html) {
    $(this.config.el).html(html);
    var tbody = $("table.mycandy-about-github > tbody");

    // bind onclick and onkeypress event
    tbody.each(function () {
        var url = $(this).attr("data-github-url");
        $(this).click(function () {
            window.open(url);
        });
        $(this).keypress(function (event) {
            if (event.keyCode == 13) {
                window.open(url);
            }
        });
    });

    var mouseover = function (one) {
        // if other tbody is highlighted, remove the highlight style.
        tbody.each(function () {
            if (this != one) {
                mouseout(this);
            }
        });

        $(one).addClass("mycandy-about-mouseover");
        var e = $(one.getElementsByClassName("mycandy-github-star"));
        e.addClass("mycandy-star");
        e.removeClass("mycandy-star-o");
        e.addClass("fa-star");
        e.removeClass("fa-star-o");
    };

    var mouseout = function (one) {
        $(one).removeClass("mycandy-about-mouseover");
        var e = $(one.getElementsByClassName("mycandy-github-star"));
        e.addClass("mycandy-star-o");
        e.removeClass("mycandy-star");
        e.addClass("fa-star-o");
        e.removeClass("fa-star");
    };

    // set css effect
    tbody.on("mouseover focus touchstart", function () {
        mouseover(this);
    });
    tbody.on("mouseout blur touchend", function () {
        mouseout(this);
    });
};

ShowCode.createReposTable = function (data, repos) {
    var dateString = function (date) {
        var d = new Date(date);
        if (isNaN(d.valueOf())) {
            return "无法获取";
        }

        var month = d.getMonth() + 1;
        month = (month < 10) ? "0" + month : month;

        var day = d.getDate();
        day = (day < 10) ? "0" + day : day;

        var hours = d.getHours();
        hours = (hours < 10) ? "0" + hours : hours;

        var minutes = d.getMinutes();
        minutes = (minutes < 10) ? "0" + minutes : minutes;

        var timezone = (0 - Math.round(d.getTimezoneOffset() / 60)) * 100;
        var sign = (timezone > 0) ? "+" : "-";
        timezone = sign + ((timezone < 1000) ? "0" + timezone : timezone);
        return d.getFullYear() + "-" + month + "-" + day + " " + hours + ":" + minutes + " " + timezone;
    };

    var html = "";
    if (repos.length > 0) {
        console.log('custom repos => ' + repos);

        for (var i = 0; i < repos.length; i++) {
            for (var j = 0; j < data.length; j++) {

                var item = data[j];

                if (repos[i].toLowerCase() == item.name.toLowerCase()) {

                    var size = item.size;
                    if (size == 0) {
                        size = "未知";
                    } else {
                        size = size + "KB";
                    }
                    html += "<tbody title='点击跳转到 github 页面' tabindex='0' data-github-url='" + item.html_url + "'>" +
                        "<tr>" +
                        "   <th>" +
                        "       <span>" +
                        "           <span class='fa fa-github-alt'></span> " + item.name + "" +
                        "       </span>" +
                        "       <span>" + item.stargazers_count + " <span class='fa fa-star-o star-o mycandy-github-star'></span>" +
                        "       </span>" +
                        "   </th>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>" + (item.description || '') + "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>Github 地址：" + item.html_url + "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>主要语言：" + (item.language || '未知') + "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>大小：" + size + "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>最近更新：" + dateString(item.pushed_at) + "</td>" +
                        "</tr>" +
                        "<tr>" +
                        "   <td>&nbsp;</td>" +
                        "</tr>" +
                        "</tbody>";
                }
            }
        }
    } else {
        for (var j = 0; j < data.length; j++) {

            var item = data[j];

            var size = item.size;
            if (size == 0) {
                size = "未知";
            } else {
                size = size + "KB";
            }

            html += "<tbody title='点击跳转到 github 页面' tabindex='0' data-github-url='" + item.html_url + "'>" +
                "<tr>" +
                "   <th>" +
                "       <span>" +
                "           <span class='fa fa-github-alt'></span> " + item.name + "" +
                "       </span>" +
                "       <span>" + item.stargazers_count + " <span class='fa fa-star-o star-o mycandy-github-star'></span>" +
                "       </span>" +
                "   </th>" +
                "</tr>" +
                "<tr>" +
                "   <td>" + (item.description || '') + "</td>" +
                "</tr>" +
                "<tr>" +
                "   <td>Github 地址：" + item.html_url + "</td>" +
                "</tr>" +
                "<tr>" +
                "   <td>主要语言：" + (item.language || '未知') + "</td>" +
                "</tr>" +
                "<tr>" +
                "   <td>大小：" + size + "</td>" +
                "</tr>" +
                "<tr>" +
                "   <td>最近更新：" + dateString(item.pushed_at) + "</td>" +
                "</tr>" +
                "<tr>" +
                "   <td>&nbsp;</td>" +
                "</tr>" +
                "</tbody>";
        }
    }
    html = "<table class='mycandy-about-github'>" + html + "</table>";
    return html;
};