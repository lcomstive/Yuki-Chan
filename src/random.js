module.exports = class Random // Adapted from https://stackoverflow.com/a/424445
{
	constructor(seed)
	{
		this.m = 0x80000000
		this.a = 1103515245
		this.c = 12345

		this.state = seed || Math.floor(Math.random() * (this.m - 1))
	}

	nextInt()
	{
		this.state = (this.a * this.state + this.c) % this.m
		return this.state
	}

	nextFloat() { return this.nextInt() / (this.m - 1) }

	nextRange(start, end)
	{
		let size = end - start
		let random = this.nextInt() / this.m
		return start + Math.floor(random * size)
	}

	choose(array) { return array[this.nextRange(0, array.length)] }
}
