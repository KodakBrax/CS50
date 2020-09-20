#include "helpers.h"
#include <math.h>

// Convert image to grayscale
void grayscale(int height, int width, RGBTRIPLE image[height][width])
{
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            int avg = round((image[i][j].rgbtBlue + image[i][j].rgbtGreen + image[i][j].rgbtRed) / 3.0);
            if (avg >= 255)
            {
                image[i][j].rgbtBlue = 255;
                image[i][j].rgbtGreen = 255;
                image[i][j].rgbtRed = 255;
            }
            else
            {
                image[i][j].rgbtBlue = avg;
                image[i][j].rgbtGreen = avg;
                image[i][j].rgbtRed = avg;
            }
        }
    }
    return;
}

// Convert image to sepia
void sepia(int height, int width, RGBTRIPLE image[height][width])
{
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            // get original red, green, and blue numbers
            int originalRed = image[i][j].rgbtRed;
            int originalGreen = image[i][j].rgbtGreen;
            int originalBlue = image[i][j].rgbtBlue;
            
            // calculate sepia colors
            int sepiaRed = round(.393 * originalRed + .769 * originalGreen + .189 * originalBlue);
            int sepiaGreen = round(.349 * originalRed + .686 * originalGreen + .168 * originalBlue);
            int sepiaBlue = round(.272 * originalRed + .534 * originalGreen + .131 * originalBlue);
            
            // check each color to see if it is greater than 255
            // red
            if (sepiaRed >= 255)
            {
                image[i][j].rgbtRed = 255;
            }
            else 
            {
                image[i][j].rgbtRed = sepiaRed;
            }
            
            // green
            if (sepiaGreen >= 255)
            {
                image[i][j].rgbtGreen = 255;
            }
            else
            {
                image[i][j].rgbtGreen = sepiaGreen;
            }
            
            // blue
            if (sepiaBlue >= 255)
            {
                image[i][j].rgbtBlue = 255;
            }
            else
            {
                image[i][j].rgbtBlue = sepiaBlue;
            }
            
        }
    }
    return;
}

// Reflect image horizontally
void reflect(int height, int width, RGBTRIPLE image[height][width])
{
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width / 2; j++)
        {
            int tempRed = image[i][j].rgbtRed;
            int tempBlue = image[i][j].rgbtBlue;
            int tempGreen = image[i][j].rgbtGreen;
            
            image[i][j].rgbtRed = image[i][width - j - 1].rgbtRed;
            image[i][j].rgbtBlue = image[i][width - j - 1].rgbtBlue;
            image[i][j].rgbtGreen = image[i][width - j - 1].rgbtGreen;
            
            image[i][width - j - 1].rgbtRed = tempRed;
            image[i][width - j - 1].rgbtBlue = tempBlue;
            image[i][width - j - 1].rgbtGreen = tempGreen;
        }
    }
    return;
}

// Blur image
void blur(int height, int width, RGBTRIPLE image[height][width])
{
    // create a temp image
    RGBTRIPLE temp[height][width];
    
    // loop through the image
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            
            double avg = 0.0;
            int red = 0, green = 0, blue = 0;
            
            for (int k = -1; k < 2; k++)
            {
                for (int t = -1; t < 2; t++)
                {
                    if(i + k != height && i + k != -1 && j + t != width && j + t != -1)
                    {
                        red += image[i + k][j + t].rgbtRed;
                        green += image[i + k][j + t].rgbtGreen;
                        blue += image[i + k][j + t].rgbtBlue;
                        avg++;
                    }
                }
            }
            
            temp[i][j].rgbtRed = round(red / avg);
            temp[i][j].rgbtGreen = round(green / avg);
            temp[i][j].rgbtBlue = round(blue / avg);
        }
    }
    
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            image[i][j].rgbtRed = temp[i][j].rgbtRed;
            image[i][j].rgbtGreen = temp[i][j].rgbtGreen;
            image[i][j].rgbtBlue = temp[i][j].rgbtBlue;
        }
    }
    return;
}
