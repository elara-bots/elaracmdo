module.exports = {
	disambiguation: (items, label, property = "name") => `Multiple ${label} found, please be more specific: ${items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(', ')}`,
};
