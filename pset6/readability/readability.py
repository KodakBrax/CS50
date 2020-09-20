from cs50 import get_string

def count_letters(text):
    numLet = 0
    for i in text:
        if (i >= 'a' and i <= 'z') or (i >= 'A' and i <= 'z'):
            numLet += 1
    return numLet
    
def count_words(text):
    numWords = 1
    for i in text:
        if i.isspace():
            numWords += 1
    return numWords
    
def count_sentences(text):
    numSent = 0
    for i in text:
        if i == '.' or i == '!' or i == '?':
            numSent += 1
    return numSent
    
def main():
    # get text from user
    text = get_string("Text: ")
    
    # get key info
    letters = count_letters(text)
    words = count_words(text)
    sentences = count_sentences(text)
    
    # calculate the grade level
    grade = 0.0588 * (100 * letters / words) - 0.296 * (100 * sentences / words) - 15.8
    level = round(grade)
    
    if level >= 16:
        print('Grade 16+')
    elif level < 1:
        print('Before Grade 1')
    else:
        print(f'Grade {level}')
        

main()



    