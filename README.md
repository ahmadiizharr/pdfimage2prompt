# 🖼️ PDF Image to Prompt Generator

A powerful web application that analyzes images and PDFs to generate optimized AI prompts for image and video generation platforms like DALL-E, Midjourney, Stable Diffusion, Runway, and Pika Labs.

## ✨ Features

### 🔍 Advanced Image Analysis
- **PDF Processing**: Extract and analyze individual images from PDF documents
- **Composite Image Detection**: Automatically detect and process multiple images within collages or grids
- **Individual Image Processing**: Process single images with detailed AI analysis
- **Smart Detection**: AI-powered identification of meaningful visual content

### 🤖 AI-Powered Prompt Generation
- **Dual Output**: Generate both image and video generation prompts
- **Platform Optimized**: Prompts optimized for different AI platforms
- **Detailed Descriptions**: Comprehensive image analysis and descriptions
- **High Quality**: Professional-grade prompts for best AI generation results

### 💻 User Experience
- **Drag & Drop Interface**: Easy file upload with visual feedback
- **Real-time Progress**: Live progress tracking with detailed status updates
- **Debug Console**: Built-in debugging interface for transparency
- **Loading Animations**: Professional loading indicators during processing
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 📤 Export Features
- **Copy Individual Prompts**: One-click copy for each generated prompt
- **Bulk Export**: Copy all image prompts, video prompts, or both
- **Download as File**: Export all prompts as organized text file
- **Professional Formatting**: Well-structured exports with timestamps

## 🚀 Live Demo

🌐 **[Try the Application](https://yourusername.github.io/pdfimgtoprompt)**

## 📋 Supported File Types

- **Images**: JPG, JPEG, PNG, WebP (max 50MB)
- **Documents**: PDF files (max 50MB)
- **Composite Images**: Photo collages, image grids, screenshot compilations

## 🛠️ How to Use

1. **Setup API Key**
   - Enter your OpenAI API key
   - Click "Validate" to verify the key

2. **Upload Files**
   - Drag & drop files or click "Pilih File"
   - Supports multiple file upload
   - Watch real-time progress tracking

3. **View Results**
   - Review generated descriptions and prompts
   - Use export features to get all prompts
   - Copy individual prompts as needed

4. **Use Prompts**
   - Use image prompts in DALL-E, Midjourney, Stable Diffusion
   - Use video prompts in Runway, Pika Labs, or similar platforms

## 🔧 Technical Details

### Built With
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI Integration**: OpenAI GPT-4o Vision API
- **PDF Processing**: PDF.js library
- **File Handling**: HTML5 File API with drag & drop
- **Styling**: Responsive CSS with modern design

### Key Technologies
- **OpenAI GPT-4o**: Advanced vision model for image analysis
- **PDF.js**: Client-side PDF processing and rendering
- **Canvas API**: High-quality image rendering from PDF pages
- **Crypto API**: SHA-256 hashing for intelligent caching
- **LocalStorage**: Client-side caching and API key storage

### Performance Features
- **Intelligent Caching**: Prevents duplicate API calls for same images
- **Batch Processing**: Efficient handling of multiple files
- **Progress Tracking**: Granular progress updates during processing
- **Error Handling**: Comprehensive error management and user feedback

## 🏃‍♂️ Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key with GPT-4o access

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/pdfimgtoprompt.git
   ```

2. Open `index.html` in your web browser

3. Enter your OpenAI API key and start using!

### Local Development
No build process required! This is a pure client-side application:
- Edit files directly
- Refresh browser to see changes
- All processing happens in the browser

## 🔒 Privacy & Security

- **Client-Side Processing**: All file processing happens in your browser
- **No Server Upload**: Files never leave your device
- **API Key Security**: Keys stored locally, never transmitted to third parties
- **No Data Collection**: We don't collect or store any user data

## 📸 Screenshots

### Main Interface
Clean, professional interface with drag & drop functionality

### Processing View
Real-time progress tracking with detailed status updates

### Results Display
Organized prompt display with export options

### Debug Console
Built-in debugging interface for transparency

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

### Development Guidelines
- Follow existing code style
- Test thoroughly before submitting
- Update documentation as needed
- Ensure responsive design compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For providing the GPT-4o Vision API
- **Mozilla**: For the excellent PDF.js library
- **Community**: For feedback and feature suggestions

## 📞 Support

If you encounter any issues or have questions:
1. Check the built-in debug console (F12)
2. Review the [Issues](https://github.com/yourusername/pdfimgtoprompt/issues) page
3. Create a new issue with detailed information

## 🔮 Roadmap

- [ ] Support for additional file formats
- [ ] Custom prompt templates
- [ ] Batch processing improvements
- [ ] Advanced export options
- [ ] API rate limiting controls

---

Made with ❤️ for the AI community