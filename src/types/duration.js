const { ArgumentType } = require("elaracmdo");
module.exports = class CurrencyType extends ArgumentType {
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
		]);
	}
	validate(value) {
		const MATCHES_ALL = value.match(/\d+\s*[A-Za-z]+/g);

		if (MATCHES_ALL) {
			for (const match of MATCHES_ALL) {
				const [ tempNum, tempStr ] = [
					parseInt(match.match(/\d+/g)),
					match.match(/[A-Za-z]+/)
				];
				if (!tempNum || (tempNum.length !== 1)) return false;
				if (!tempStr || (tempStr.length !== 1)) return false;
				if (!Number.isInteger(parseInt(tempNum[0])) || !this.timeIds.has(tempStr[0])) return false;
			}

			return true;
		}

		return false;
	}
	parse(value) {
		const MATCHES_ALL = value.match(/\d+\s*[A-Za-z]+/g);

		if (MATCHES_ALL) {
			let totalTime = 0;
			MATCHES_ALL.forEach(dur => {
				const [ tempNum, tempStr ] = [
					parseInt(dur.match(/\d+/g)[0]),
					dur.match(/[A-Za-z]+/)[0]
				];
				if (isNaN(tempNum)) totalTime = 0;
				else totalTime += tempNum * this.determineTimeType(tempStr);
			});
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
};
