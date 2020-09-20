#include <stdio.h>
#include <cs50.h>

int main(void) {
    
    long n = get_long("Number: ");
    while(n < 0) {
        n = get_long("Number: ");
    }
    long tempN = n;
    
    // count the number of digits in the number
    int count = 0;
    while(tempN > 0) {
        tempN = tempN / 10;
        count++;
    }

    // find the first two digits
    long firstDigs = n;
    while(firstDigs > 100) {
        firstDigs = firstDigs / 10;
    }
    
    // implement luhns algorithm
    int i = 1;
    int sum = 0;
    while(n > 0) {
        int digit = n % 10;
        if(i % 2 == 0) {
            digit *= 2;
            sum += digit % 10 + digit / 10;
        } else {
            sum += digit;
        }
        n = n / 10;
        i++;
    }
    // determine the identity of the card
    if(count == 15 && (firstDigs == 34 || firstDigs == 37) && sum % 10 == 0) {
        printf("AMEX\n");
    } else if(count == 16 && (firstDigs > 50 && firstDigs < 56) && sum % 10 == 0) {
        printf("MASTERCARD\n");
    } else if((count == 13 || count == 16) && (firstDigs / 10 == 4) && sum % 10 == 0) {
        printf("VISA\n");
    } else {
        printf("INVALID\n");
    }
    
}