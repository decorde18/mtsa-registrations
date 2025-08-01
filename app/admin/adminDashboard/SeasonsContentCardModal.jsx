"use client";

import Button from "@/styles/components/Button";
import styled from "styled-components";

import { useEffect, useState } from "react";
import { useDataOperations } from "@/hooks/useDataOperations";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/styles/components/Modal";

const CloseButton = styled.button`
  background: ${({ theme }) => theme.colors.muted};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.error};
    transform: scale(1.05);
  }
`;
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.small};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
const Input = styled.input`
  padding: 14px 16px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  font-size: ${({ theme }) => theme.fontSize.input};
  transition: all 0.2s ease;
  background: ${({ theme }) => theme.colors.white};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: ${({ theme }) => theme.colors.primary};
`;
const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 8px;
`;
const CancelButton = styled(Button)`
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    background: ${({ theme }) => theme.colors.text};
  }
`;
const SubmitButton = styled(Button)`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
  }
`;

function SeasonsContentCardModal({
  onClose,
  setSeasons,
  seasons,
  formData,
  setFormData,
  editingSeason,
  setEditingSeason,
  showToast,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRecord, updateRecord } = useDataOperations();

  const handleSeasonSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mtsa_name.trim()) {
      showToast("Season name is required", "error");
      return;
    }

    if (editingSeason) {
      setSeasons(
        seasons.map((s) =>
          s.id === editingSeason.id
            ? { ...s, ...formData, id: editingSeason.id }
            : s
        )
      );
      try {
        await updateRecord("seasons", editingSeason.id, formData);
      } catch (error) {
        console.log("Failed to edit season", error);
      }
      showToast("Season updated successfully", "success");
    } else {
      setSeasons([
        ...seasons,
        {
          ...formData,
          id: Date.now(),
          playerCount: 0,
        },
      ]);
      setIsSubmitting(true);
      try {
        await createRecord("seasons", formData);
        // Season is automatically added to context via the hook
      } catch (error) {
        console.error("Failed to create season:", error);
        // Handle error (show toast, etc.)
      } finally {
        setIsSubmitting(false);
      }
      showToast("Season created successfully", "success");
    }

    onClose();
    setEditingSeason(null);
    setFormData({
      mtsa_name: "",
      tnsoccer_year: new Date().getFullYear(),
      tnsoccer_season_id: "",
      tnsoccer_season_name: "",
      actual_year: new Date().getFullYear(),
      is_active: true,
    });
  };

  return (
    <Modal onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {editingSeason ? "Edit Season" : "Add New Season"}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSeasonSubmit}>
          <FormGroup>
            <Label>MTSA Season Name</Label>
            <Input
              type='text'
              value={formData.mtsa_name}
              onChange={(e) =>
                setFormData({ ...formData, mtsa_name: e.target.value })
              }
              placeholder='e.g., Spring 2025'
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>TNSoccer Year</Label>
            <Input
              type='number'
              value={formData.tnsoccer_year}
              onChange={(e) =>
                setFormData({ ...formData, tnsoccer_year: e.target.value })
              }
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>TNSoccer Name</Label>
            <Input
              type='text'
              value={formData.tnsoccer_season_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tnsoccer_season_name: e.target.value,
                })
              }
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>TNSoccer Id</Label>
            <Input
              type='number'
              value={formData.tnsoccer_season_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tnsoccer_season_id: e.target.value,
                })
              }
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Actual Year</Label>
            <Input
              type='number'
              value={formData.actual_year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actual_year: parseInt(e.target.value),
                })
              }
              min='2000'
              max='2030'
              required
            />
          </FormGroup>

          <CheckboxContainer>
            <Checkbox
              type='checkbox'
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            Active Season
          </CheckboxContainer>

          <ButtonContainer>
            <CancelButton type='button' onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type='submit'>
              {editingSeason ? "Update Season" : "Create Season"}
            </SubmitButton>
          </ButtonContainer>
        </Form>
      </ModalContent>
    </Modal>
  );
}

export default SeasonsContentCardModal;
