# Manual Image Segmentation for Feizi Lab Interview 2023
This is a website that asks the user to upload some number of images.
The images are displayed one by one, and the user is asked to segment the main object in the image.
The segmentation mask for any image can be saved.
After all images are segmented, the user can choose to add noise to the image and repeat the process.

The website also classifies images and asks the user if the classification is correct.

## Instructions
- Clone this repo
- Create an account for [Imagga](https://imagga.com/)
- Go to the dashboard and copy the Authorization header
- Navigate to `/src/keys/Imagga.js`
- Set `AUTH_HEADER` to the Authorization header
- Start the development server
```
npm i
npm run start
```

## Issues
Noise is added to the images using Caman.js.

Attempting to resize the canvas using Caman will occaisionally cause an error causing the website not to render.

Because of this, large images are difficult to work with an will require the user to manually scroll to see the whole image.