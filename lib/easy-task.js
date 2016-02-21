var Event  = require('events').EventEmitter;
var timeup = create_timer();


module.exports = newTask;


/**
 * 每当到达间隔时间, 且没有被 interrupt, 则执行任务 task_func
 * return {
 *    // 调用该方法后直到下一个间隔时间到达才会执行任务
 * 		interrupt: function(),
 *    // 停止任务
 *    stop: function()
 * }
 */
function newTask(interval_seconds, task_func) {
	var begint;
	var ret = {};
	

	ret.interrupt = function() {
		begint = process.uptime();
	};

	ret.stop = function() {
		task_func = null;
		timeup.del(time_listener);
	};

	ret.interrupt();
	timeup.add(time_listener);


	function time_listener(now_time) {
		if (now_time >= begint + interval_seconds) {
			task_func();
			ret.interrupt();
		}
	}

	return ret;
}


function create_timer() {
	var timeup = new Event();
	var timeid = 0;
	var ret = {
		add : add,
		del : del,
	};


	function add(time_listener) {
		timeup.on('timeup', time_listener);

		if (!timeid) {
			timeid = setInterval(function() {
				timeup.emit('timeup', process.uptime());
			}, 5 * 1000);
		}
	}


	function del(time_listener) {
		timeup.removeListener('timeup', time_listener);

		if (Event.listenerCount(timeup, 'timeup') < 1) {
			clearInterval(timeid);
			timeid = 0;
		}
	}

	return ret;
}