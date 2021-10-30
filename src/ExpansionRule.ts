// An ExpansionRule class to represent the result of mapping a 
// particular character to a new set of characters during the grammar 
// expansion phase of the L-System. By making a class to represent 
// the expansion, you can have a single character expand to multiple 
// possible strings depending on some probability by querying a 
// Map<string, ExpansionRule>.