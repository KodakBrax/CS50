#include <stdio.h>
#include <cs50.h>
#include <string.h>
#include <ctype.h>
#include <math.h>

int count_letters(string text);
int count_words(string text);
int count_sentences(string text);

int main(void) {
    // get text from user
    string text = get_string("Text: ");
    
    // get key information
    int letters = count_letters(text);
    int words = count_words(text);
    int sentences = count_sentences(text);
    
    // calculate the grade level
    float grade = 0.0588 * (100 * (float) letters / words) - 0.296 * (100 * (float) sentences / words) - 15.8;
    int level = round(grade);
    
    // determine the grade level
    if(level >= 16) {
        printf("Grade 16+\n");
    } else if(level < 1) {
        printf("Before Grade 1\n");
    } else {
        printf("Grade %i\n", level);
    }
}

// function to count letters
int count_letters(string text) {
    // count the number of letters
    int count = 0;
    for(int i = 0; i < strlen(text); i++) {
        if((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z')) {
            count++;
        }
    }
    // return count
    return count;
}

// function to count words
int count_words(string text) {
    // count the number of words
    int count = 1;
    for(int i = 0; i < strlen(text); i++) {
        if(isspace(text[i])) {
            count++;   
        }
    }
    // return count
    return count;
}

// function to count sentences 
int count_sentences(string text) {
    // count the number of sentences
    int count = 0;
    for(int i = 0; i < strlen(text); i++) {
        if(text[i] == '.' || text[i] == '!' || text[i] == '?') {
            count++;
        }
    }
    // return count
    return count;
}