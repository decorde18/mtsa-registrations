"use client";

import styled from "styled-components";

import { ContentCard, SectionTitle } from "@/styles/components/Card";
import { Upload } from "lucide-react";
import UploadExcelTnSoccer from "@/components/UploadExcelTnSoccer";
import { useDataContext } from "@/contexts/DataContext";
const UploadSection = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: #f9fafb;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #4f46e5;
    background: #f0f9ff;
  }

  &.drag-active {
    border-color: #4f46e5;
    background: #eff6ff;
  }
`;
const UploadIcon = styled.div`
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 16px;
`;
const UploadText = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
`;
function UploadContainer() {
  return (
    <ContentCard>
      <SectionTitle>
        <Upload />
        File Upload Center
      </SectionTitle>
      <UploadSection>
        <UploadIcon>📁</UploadIcon>
        <UploadText>TN Soccer registration files</UploadText>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "0.9rem",
            marginTop: "10px",
          }}
        >
          Drag and drop your Excel files here, or click to browse
        </p>
      </UploadSection>
      <UploadExcelTnSoccer />
    </ContentCard>
  );
}

export default UploadContainer;
