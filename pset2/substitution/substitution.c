#include <stdio.h>
#include <cs50.h>
#include <ctype.h>
#include <string.h>

int position(char array[], char a);

const int ALPH_LEN = 26;

int main(int argc, string argv[]) {
    // validate user key
    // check if length of array is correct
    if(argc != 2) {
        printf("Usage: ./substituion KEY\n");
        return 1;
    } 
    // check to make sure string length is correct
    if(strlen(argv[1]) != 26) {
        printf("Key must contain 26 characters.\n");
        return 1;
    } 
    
    // check for repeated characters in  and is an alphabetic character
    for(int i = 0; i < strlen(argv[1]); i++) {
        if(!isalpha(argv[1][i])) {
            printf("Key must only contain alphabetic characters.\n");
            return 1;
        }
        
        for(int j = 0; j < strlen(argv[1]); j++) {
            char c = tolower(argv[1][j]);
            char a = tolower(argv[1][i]);
            if(c == a && i != j) {
                printf("Key must not contain repeated characters.\n");
                return 1;
            }
            
        }
    }
    
    // get plain text from user
    string text = get_string("plaintext: ");
    
    // create position array 
    char key[ALPH_LEN];
    for(int i = 0; i < ALPH_LEN; i++) {
        key[i] = 'a' + i;
    }
    
    char cipher[strlen(text)];
    string crypto = argv[1];
    for(int i = 0; i < strlen(text); i++) {
        char c = tolower(text[i]);
        if(!isalpha(c)) {
            cipher[i] = text[i];
        } else {
            if(isupper(text[i])) {
                cipher[i] = toupper(crypto[position(key, c)]);
            } else {
                cipher[i] = tolower(crypto[position(key, c)]);
            }
        }
    }
    
    printf("ciphertext: %s\n", cipher);
    return 0;
}

int position(char array[], char a) {
    int position = -1; 
    for(int i = 0; i < ALPH_LEN; i++) {
        if(array[i] == a) {
            position = i;
        }
    }
    return position;
}