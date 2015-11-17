Goblin.Utility = {
	getUid: (function() {
		var uid = 0;
		return function() {
			return uid++;
		};
	})()
};