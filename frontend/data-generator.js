// Create this new file for the data generation UI

document.addEventListener('DOMContentLoaded', () => {
  const generateForm = document.getElementById('generate-form');
  const dataDisplay = document.getElementById('data-display');
  const importButton = document.getElementById('import-button');
  const statusDiv = document.getElementById('status');
  
  let generatedData = null;
  
  generateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const count = document.getElementById('count-input').value;
    const subject = document.getElementById('subject-input').value.trim();
    const persona = document.getElementById('persona-input').value.trim();
    const specialInstructions = document.getElementById('special-instructions').value.trim();
    const types = Array.from(document.querySelectorAll('input[name="types"]:checked'))
      .map(cb => cb.value);
    
    statusDiv.textContent = 'Generating data...';
    
    try {
      const response = await fetch('/api/generate-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          count, 
          types, 
          subject,
          persona,
          specialInstructions
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      generatedData = result.data;
      
      // Display sample of the data
      dataDisplay.innerHTML = `
        <h3>Generated ${generatedData.length} items</h3>
        <pre>${JSON.stringify(generatedData.slice(0, 2), null, 2)}</pre>
        <p>... ${generatedData.length - 2} more items</p>
        <button id="download-button" class="btn tertiary">Download JSON File</button>
      `;
      
      // Add event listener for the download button
      document.getElementById('download-button').addEventListener('click', () => {
        // Create a Blob with the JSON data
        const jsonBlob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
        
        // Create a URL for the Blob
        const blobUrl = URL.createObjectURL(jsonBlob);
        
        // Create a download link and click it
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `synthetic_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
      });
      
      importButton.disabled = false;
      statusDiv.textContent = 'Data generated successfully!';
      enableVisualization();
    } catch (error) {
      statusDiv.textContent = `Error: ${error.message}`;
      console.error('Generation error:', error);
    }
  });
  
  importButton.addEventListener('click', async () => {
    if (!generatedData) return;
    
    statusDiv.textContent = 'Importing data to vector store...';
    
    try {
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: generatedData })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      statusDiv.textContent = `Imported ${result.message}`;
    } catch (error) {
      statusDiv.textContent = `Import error: ${error.message}`;
      console.error('Import error:', error);
    }
  });

  // Add file upload handler
  const fileUploadInput = document.getElementById('file-upload');
  const uploadButton = document.getElementById('upload-button');

  uploadButton.addEventListener('click', () => {
    const file = fileUploadInput.files[0];
    if (!file) {
      statusDiv.textContent = 'Please select a JSON file first';
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        // Parse the JSON data
        generatedData = JSON.parse(event.target.result);
        
        // Display sample of the data
        dataDisplay.innerHTML = `
          <h3>Loaded ${generatedData.length} items from file</h3>
          <pre>${JSON.stringify(generatedData.slice(0, 2), null, 2)}</pre>
          <p>... ${generatedData.length - 2} more items</p>
          <button id="download-button" class="btn tertiary">Download JSON File</button>
        `;
        
        // Add event listener for the download button
        document.getElementById('download-button').addEventListener('click', () => {
          // Create a Blob with the JSON data
          const jsonBlob = new Blob([JSON.stringify(generatedData, null, 2)], { type: 'application/json' });
          const blobUrl = URL.createObjectURL(jsonBlob);
          
          // Create a download link and click it
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = `synthetic_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          
          // Clean up
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobUrl);
        });
        
        importButton.disabled = false;
        statusDiv.textContent = 'File loaded successfully!';
        enableVisualization();
      } catch (error) {
        statusDiv.textContent = `Error parsing JSON file: ${error.message}`;
        console.error('JSON parsing error:', error);
      }
    };
    
    reader.onerror = function() {
      statusDiv.textContent = 'Error reading file';
      console.error('FileReader error');
    };
    
    // Read the file as text
    reader.readAsText(file);
  });

  // Import visualization handling
  const visualizationSection = document.getElementById('visualization-section');
  const generateVisualizationBtn = document.getElementById('generate-visualization');
  const chartTypeSelect = document.getElementById('chart-type');

  // Enable visualization when data is available
  function enableVisualization() {
    visualizationSection.style.display = 'block';
  }

  // Handle visualization generation
  generateVisualizationBtn.addEventListener('click', () => {
    if (!generatedData) {
      statusDiv.textContent = 'Please generate or load data first';
      return;
    }
    
    const visualizer = new TemporalVisualizer(generatedData);
    const chartType = chartTypeSelect.value;
    
    visualizer.generateVisualization(chartType, 'visualization-chart', 'patterns-list');
  });
}); 