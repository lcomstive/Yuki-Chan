module.exports =
{
	canUseEmoji(emoji, guild)
	{
		if(!emoji.includes(':'))
			return true // Not a custom emoji

		// Check if can use this emoji
		let colonIndex = emoji.lastIndexOf(':')
		const emojiID = emoji.substr(colonIndex + 1, emoji.length - colonIndex - 2)
		return guild.emojis.resolve(emojiID) != null
	}
}