import { useState, useEffect } from "react";
import { prepareDocuments } from "../utils/documentUtils";

export const useChecklistDocuments = (checklist) => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    console.log('🚀 ========== useChecklistDocuments START ==========');
    console.log('📋 Checklist object:', checklist);
    console.log('📋 Checklist ID:', checklist?._id);
    console.log('📋 Checklist title:', checklist?.title);
    
    if (!checklist) {
      console.log('❌ No checklist provided');
      setDocs([]);
      return;
    }
    
    // Check ALL possible document locations
    console.log('🔍 Checking for documents in checklist object...');
    console.log('1. checklist.documents:', checklist.documents);
    console.log('2. checklist.documents is array?', Array.isArray(checklist.documents));
    console.log('3. checklist.documents length:', checklist.documents?.length);
    
    // Check for nested structures
    console.log('4. checklist.data?.documents:', checklist.data?.documents);
    console.log('5. checklist.response?.documents:', checklist.response?.documents);
    console.log('6. checklist.result?.documents:', checklist.result?.documents);
    
    // Check for alternative property names
    console.log('7. checklist.attachments:', checklist.attachments);
    console.log('8. checklist.files:', checklist.files);
    console.log('9. checklist.documentList:', checklist.documentList);
    console.log('10. checklist.docList:', checklist.docList);
    
    // Log ALL keys of checklist to see what's available
    console.log('🔑 All checklist keys:', Object.keys(checklist || {}));
    
    if (checklist.documents && Array.isArray(checklist.documents)) {
      console.log('✅ Found documents in checklist.documents');
      console.log('📄 First document sample:', checklist.documents[0]);
      
      if (checklist.documents.length > 0) {
        console.log('🔑 Keys of first document:', Object.keys(checklist.documents[0]));
      }
      
      const preparedDocs = prepareDocuments(checklist);
      console.log('✅ Prepared documents:', preparedDocs);
      console.log('✅ Prepared documents length:', preparedDocs.length);
      setDocs(preparedDocs);
    } else {
      console.log('❌ No documents array found in checklist.documents');
      console.log('💡 Type of checklist.documents:', typeof checklist.documents);
      setDocs([]);
    }
    
    console.log('🚀 ========== useChecklistDocuments END ==========');
  }, [checklist]);

  return docs;
};