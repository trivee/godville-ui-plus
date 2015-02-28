// ui_timers
var ui_timers = window.wrappedJSObject ? createObjectIn(worker.GUIp, {defineAs: "timers"}) : worker.GUIp.timers = {};

ui_timers.init = function() {
	if (ui_data.hasTemple && !ui_data.isFight && !ui_data.isDungeon) {
		document.querySelector('#imp_button').insertAdjacentHTML('afterend', '<div id=\"laying_timer\" class=\"fr_new_badge\" />');
		this.layingTimer = document.querySelector('#laying_timer');
		this.isDisabled = ui_storage.get('Option:disableLayingTimer');

		this.layingTimer.style.display = this.isDisabled ? 'none' : 'block';

		ui_timers.tick();
		worker.setInterval(ui_timers.tick.bind(ui_timers), 60000);
	}
};
ui_timers.tick = function() {
	var latestEntryDateFS = ui_storage.get('thirdEyeLatestEntry') && new Date(ui_storage.get('thirdEyeLatestEntry')),
		earliestEntryDateFS = ui_storage.get('thirdEyeEarliestEntry') && new Date(ui_storage.get('thirdEyeEarliestEntry')),
		lastLayingDateFS = ui_storage.get('thirdEyeLastLayingEntry') && new Date(ui_storage.get('thirdEyeLastLayingEntry'));
	this._lastLayingDate = 0;
	for (var msg in worker.so.state.diary_i) {
		var curEntryDate = new Date(worker.so.state.diary_i[msg].time);
		if (msg.match(/^(?:Возложила?|Выставила? тридцать золотых столбиков|I placed \w+? bags of gold)/)) {
			this._lastLayingDate = curEntryDate > this._lastLayingDate ? curEntryDate : this._lastLayingDate;
		}
		if (!this._latestEntryDate || this._latestEntryDate < curEntryDate) {
			this._latestEntryDate = curEntryDate;
		}
		if (!this._earliestEntryDate || this._earliestEntryDate > curEntryDate) {
			this._earliestEntryDate = curEntryDate;
		}
	}
	if (latestEntryDateFS >= this._earliestEntryDate) {
		this._earliestEntryDate = earliestEntryDateFS;
		if (this._lastLayingDate) {
			ui_storage.set('thirdEyeLastLayingEntry', this._lastLayingDate);
		} else {
			this._lastLayingDate = lastLayingDateFS;
		}
	} else {
		ui_storage.set('thirdEyeEarliestEntry', this._earliestEntryDate);
		ui_storage.set('thirdEyeLastLayingEntry', this._lastLayingDate || '');
	}
	ui_storage.set('thirdEyeLatestEntry', this._latestEntryDate);
	if (!this.isDisabled) {
		ui_timers._calculateTime();
	}
};
ui_timers._calculateTime = function() {
	var $timer = document.querySelector('#timers');
	$timer.className = $timer.className.replace(/green|yellow|red|grey/g, '');
	if (this._lastLayingDate) {
		this._total_minutes = Math.ceil((Date.now() + 1 - this._lastLayingDate)/1000/60);
		ui_timers._setTimer(this._total_minutes > 36*60 ? 'green' : this._total_minutes > 18*60 ? 'yellow' : 'red');
	} else {
		this._total_minutes = Math.floor((Date.now() - this._earliestEntryDate)/1000/60);
		ui_timers._setTimer(this._total_minutes > 36*60 ? 'green' : 'grey');
	}
};
ui_timers._formatTime = function() {
	var countdown_minutes = 36*60 - this._total_minutes,
		hours = Math.floor(countdown_minutes/60),
		minutes = Math.floor(countdown_minutes%60);
	return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
};
ui_timers._calculateExp = function() {
	var base_exp = Math.min(this._total_minutes/36/60*2, 2),
		amount_multiplier = [1, 2, 2.5],
		level_multiplier = ui_stats.get('Level') < 100 ? 1 : ui_stats.get('Level') < 125 ? 0.5 : 0.25,
		title = [];
	for (var i = 1; i <= 3; i++) {
		title.push(i + '0k gld → ' + ((i + base_exp*amount_multiplier[i - 1])*level_multiplier).toFixed(1) + '% exp');
	}
	return title.join('\n');
};
ui_timers._setTimer = function(color) {
	this.layingTimer.classList.add(color);
	if (color === 'grey') {
		this.layingTimer.textContent = '?';
		this.layingTimer.title = worker.GUIp_i18n.gte_unknown_penalty + ui_timers._formatTime();
	} else {
		this.layingTimer.textContent = color === 'green' ? '✓' : ui_timers._formatTime();
		this.layingTimer.title = ui_timers._calculateExp();
	}
};