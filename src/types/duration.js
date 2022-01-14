const { ArgumentType } = require("elaracmdo");

module.exports = class DurationType extends ArgumentType {
	constructor(client) {
		super(client, "duration");
		this.duration = 0;
		this.timeIds = new Set([
			"ms", "millisecond", "milliseconds",
			"s", "second", "seconds",
			"m", "min", "mins", "minute", "minutes",
			"h", "hr", "hrs", "hour", "hours",
			"d", "day", "days",
			"w", "week", "weeks",
			"mo", "month", "months",
			"y", "year", "years"
		])
	}
	
	validate(value) {
		const MATCHES_ALL = value.match(/\d+\s*[A-Za-z]+/g);
		if (MATCHES_ALL) {
			for (const match of MATCHES_ALL) {
				let [ num, str ] = [
					match.match(/\d+/g),
					match.match(/[A-Za-z]+/g)
				]
				if (!num || (num.length !== 1)) return false;
				if (!str || (str.length !== 1)) return false;
				if (!Number.isInteger(parseInt(num[0]))) return false;
				if (!this.timeIds.has(str[0])) return false;
			}

			return true;
		}

		return false;
	}
	parse(value) {
		const MATCHES_ALL = value.match(/\d+\s*[A-Za-z]+/g);
		if (MATCHES_ALL) {
			let totalTime = 0;
			for (const dur of MATCHES_ALL) {
				const [ num, str ] = [
					parseInt(dur.match(/\d+/g)[0]),
					dur.match(/[A-Za-z]+/g)[0]
				];
				if (isNaN(num)) totalTime = 0;
				else totalTime += num * this.determineTimeType(str);
			}
			if (totalTime) {
				this.duration = totalTime;
				return this.duration;
			}
		}

		return null;
	}
	determineTimeType(str) {
		switch (str) {
			case "ms": case "millisecond": case "milliseconds": return 1;
			
			case "s": case "second": case "seconds": return 1000;
			
			case "m": case "min": case "mins": case "minute": case "minutes": return 60 * 1000;
			
			case "h": case "hr": case "hour": case "hours": return 60 * 60 * 1000;
			
			case "d": case "day": case "days": return 24 * 60 * 60 * 1000;
			
			case "w": case "week": case "weeks": return 7 * 24 * 60 * 60 * 1000;
			
			case "mo": case "month": case "months": return 30 * 24 * 60 * 60 * 1000;
			
			case "y": case "year": case "years": return 365 * 24 * 60 * 60 * 1000;
			
			default: return 1;
		}
	}
}