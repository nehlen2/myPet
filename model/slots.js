class slot {
	constructor(slotId, sitter, owner, beginDateTime, endDateTime, status) {
		this.slotId = slotId;
		this.sitter = sitter;
		this.owner = owner;
		this.beginDateTime = beginDateTime;
		this.endDateTime = endDateTime;
		this.status = status;
	}
	getSitter() {
		return this.sitter;
	}
	getOwner() {
		return this.owner;
	}
	getBeginDateTime() {
		return this.beginDateTime;
	}
	getEndDateTime() {
		return this.endDateTime;
	}
	getStatus() {
		return this.status;
	}
	setSitter(sitter) {
		this.sitter = sitter;
	}
	setOwner(owner) {
		this.owner = owner;
	}
	setBeginDateTime(beginDateTime) {
		this.beginDateTime = beginDateTime;
	}
	setEndDateTime(endDateTime) {
		this.endDateTime = endDateTime;
	}
	setStatus(status) {
		this.status = status;
	}
	printSlot() {
		console.log(`Sitter: ${this.sitter}, Owner: ${this.owner}, BeginDateTime: ${this.beginDateTime}, EndDateTime: ${this.endDateTime}, Status: ${this.status}`);
	}
}