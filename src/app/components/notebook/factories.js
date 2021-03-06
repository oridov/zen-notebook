//notebook
//TODO: Notice reuse between notebook and nanowrimo and refactor into base application
zenNotebook.factory('notebookFactory', ['$rootScope', 'storageFactory', 'fileDialog', function ($rootScope, storageFactory, fileDialog) {
    var notebook = {
        years: {},
        file: null,
        currentDate: null,
        activeDate: null,
        activeDateText: function () {
            return this.activeYear + '-' + this.activeMonth + '-' + this.activeDay
        },
        activeYear: null,
        activeMonth: null,
        activeDay: null,
        onLoad: function () {
            var file = storageFactory.getStorage('file');

            if (file) {
                this.loadNotebook(file);
                this.activeMonth = this.activeMonth + 1;
                var content = this.getDaysContent(this.activeDateText());
                storageFactory.setStorage('content', content);
            } else {
                this.setActiveDate(this.currentDate);
            }
            return this.getDaysContent(this.activeDateText())
        },
        onWrite: function (content) {
            var count = this.countWords(content);
            storageFactory.setStorage('content', content);
            storageFactory.setStorage('word_count', count);
        },
        onChangeDate: function (oldDate, newDate) {
            var old = oldDate.split('-');
            this.setDaysContent(old[0] + '-' + old[1] + '-' + old[2]);
            if (this.getDaysContent(newDate)) {
                return this.getDaysContent(newDate);
            } else {
                return '';
            }
        },
        onExit: function () {
            var file = storageFactory.getStorage('file');

            if (file) {
                this.setDaysContent(this.activeDateText());
                this.saveNotebook(file);
            } else {
                //TODO: Warning of lost data
            }
        },
        getDaysContent: function (dateText) {
            var dates = dateText.split('-');
            try {
                return this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]['content']
                    .replace(/\n/g, "<br>");
            } catch (err) {
                storageFactory.setStorage('error', err);
                return '';
            }
        },
        setDaysContent: function (dateText) {
            if (this.getActiveContent().length > 0) {
                dates = dateText.split('-');
                if (!this.years[parseInt(dates[0])][parseInt(dates[1])]) {
                    this.years[parseInt(dates[0])][parseInt(dates[1])] = {};
                }
                if (this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]) {
                    this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]['content'] = this.getActiveContent();
                    this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]['word_count'] = this.countWords(this.getActiveContent());
                } else {
                    this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])] = {};
                    this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]['content'] = this.getActiveContent();
                    this.years[parseInt(dates[0])][parseInt(dates[1])][parseInt(dates[2])]['word_count'] = this.countWords(this.getActiveContent());
                }
            }
        },
        setActiveDate: function (rawDate) {
            var date;
            if (rawDate instanceof Date) {
                date = rawDate;
            } else {
                var dateList = rawDate.split('-');
                date = new Date(dateList[0], dateList[1], dateList[2]);
            }
            this.activeDate = date;
            this.activeMonth = this.activeDate.getMonth();
            this.activeYear = this.activeDate.getFullYear();
            this.activeDay = this.activeDate.getDate();
            if (!this.years[this.activeYear]) {
                this.years[this.activeYear] = {};
            }
            if (!this.years[this.activeYear][this.activeMonth]) {
                this.years[this.activeYear][this.activeMonth] = {};
            }
            if (!this.years[this.activeYear][this.activeMonth][this.activeDay]) {
                this.years[this.activeYear][this.activeMonth][this.activeDay] = {};
            }
        },
        //TODO:Parse before saving
        getActiveContent: function () {
            return storageFactory.getStorage('content')
                .replace(/<br>/g, "\n")
                .replace(/<div>/g, "\n")
                .replace(/<\/div>/g, "")
        },
        countWords: function (s) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/[ ]{2,}/gi, " ");
            s = s.replace(/\n /, "\n");
            return s.split(' ').length;
        },
        getMonthCount: function () {
            var count = 1000;

            return count;
        },
        getMonthAverage: function () {
            var average = 1000;

            return average;
        },
        getSidebar: function () {
            return {
                word_count: this.countWords(this.getActiveContent()),
                month_average: this.getMonthAverage(),
                month_count: this.getMonthCount()
            };
        },
        getMenu: function () {
            return [
                {title: 'Calendar', action: 'calendar', class: 'fa fa-calendar', sub: 'left'}
            ];
        },
        activeTags: '',
        saveNotebook: function (filename) {
            var journal;
            this.file = filename;
            this.setDaysContent(this.activeDateText());
            journal = JSON.stringify(this);
            try {
                fileDialog.writeFile(filename, journal);
                storageFactory.setStorage('file', this.file);
                return journal;
            } catch (err) {
                storageFactory.setStorage('error', err);
                storageFactory.setStorage('recovery', journal);
            }
        },
        loadNotebook: function (file) {
            var data = fileDialog.readFile(file);
            if (data) {
                tempJournal = JSON.parse(data);
                this.file = file;
                this.currentDate = new Date();
                this.years = tempJournal.years;
                storageFactory.setStorage('file', this.file);
            } else {
                storageFactory.deleteStorage('file');
            }
        }
    };
    if (!notebook.currentDate) {
        notebook.currentDate = new Date();
    }
    if (!notebook.activeDate) {
        notebook.setActiveDate(notebook.currentDate);
    }
    return notebook;
}]);

//calendar
zenNotebook.factory('calendarFactory', ['$rootScope', 'notebookFactory', function ($rootScope, notebookFactory) {
    return {
        monthNames: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
        days: ['s', 'm', 't', 'w', 't', 'f', 's'],
        daysInMonth: function (date) {
            var isLeapYear = function (year) {
                return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
            };
            return [31, (isLeapYear(date.getYear()) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][date.getMonth()];
        },
        formatDateHeading: function (date) {
            var m = this.monthNames[date.getMonth()];
            return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + date.getFullYear();
        },
        currentDate: new Date(),
        //TODO: Clean this up
        getTemplate: function (month, year, dates) {
            var month = ((isNaN(month) || month == null) ? this.currentDate.getMonth() + 1 : month) - 1,
                year = (isNaN(year) || year == null) ? this.currentDate.getFullYear() : year,
                firstDay = new Date(
                    year, month, 1),
                startDay = firstDay.getDay(),
                monthLength = this.daysInMonth(firstDay),
                heading = this.formatDateHeading(firstDay),
                tpl = [
                    '<div id="cal" class="cal">',
                    '<table class="cal">',
                        '<tr><th colspan="7">' + heading + '</th></tr>',
                    '<tr>'],
                day = 1,
                rows = Math.ceil((monthLength + startDay) / 7);
            if (!dates || !dates.length) dates = [this.currentDate.getDate()];
            this.days.forEach(function (day) {
                tpl.push('<td class="cal-head">' + day.toUpperCase() + '</td>');
            });
            tpl.push('</tr>');
            for (var i = 0; i < rows; i++) {
                var row = ['<tr>'];
                for (var j = 0; j < 7; j++) {
                    row.push('<td>');
                    if (day <= monthLength && (i > 0 || j >= startDay)) {
                        var trueYear = year;
                        var nextYear = year;
                        var date = year + '-' + month + '-' + day;
                        var trueMonth = month + 1;
                        if (trueMonth == 13) {
                            trueMonth = 1;
                            trueYear = year + 1;
                            nextYear = trueYear;
                        }
                        var nextMonth = trueMonth + 1;
                        if (nextMonth == 13) {
                            nextMonth = 1;
                            nextYear = year + 1;
                        }
                        var trueDate = year + '-' + trueMonth + '-' + day;
                        if (dates.indexOf(day) == -1) {
                            //TODO: Have a today custom class
                            //TODO: This check doesn't work on first load - need a notebook init function
                            if (notebookFactory.getDaysContent(trueDate).length > 0) {
                                row.push('<div class="cal-day cal-content" data-date="' + trueDate +
                                    '" data-month=' + trueMonth + ' data-day=' + day + ' data-year=' + year + ' data-action="set-date" changedate>');
                            } else {
                                row.push('<div class="cal-day" data-date="' + trueDate +
                                    '" data-month=' + trueMonth + ' data-day=' + day + ' data-year=' + year + ' data-action="set-date" changedate>');
                            }
                        } else {
                            row.push('<div class="cal-day cal-highlight" data-date="' + trueDate +
                                '" data-month=' + trueMonth + ' data-day=' + day + ' data-year=' + year + ' data-action="set-date" changedate>');
                        }
                        row.push(day + '</div>');
                        day++;
                    }
                    row.push('</td>');
                }
                row.push('</tr>');
                tpl.push(row.join(''));
            }
            tpl.push('</table><div class="navigation"><span class="fa fa-arrow-left" data-month=' + (trueMonth - 1) + ' data-year=' + year + ' data-action="month-back" changedate></span>' +
                '<span class="today" data-month=' + trueMonth + ' data-day=' + this.currentDate.getDate() + ' data-year=' + year + ' data-action="set-date" changedate>Today</span>' +
                '<span class="fa fa-arrow-right" data-month=' + nextMonth + ' data-year=' + nextYear + ' data-action="month-forward" changedate></span></div></div>');
            return tpl.join('');
        }
    }
}]);