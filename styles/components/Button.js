import styled from "styled-components";

const Button = styled.button`
  padding-top: ${({ theme }) => theme.spacing.paddingMedium};
  padding-bottom: ${({ theme }) => theme.spacing.paddingMedium};
  padding-right: ${({ theme }) => theme.spacing.paddingLarge};
  padding-left: ${({ theme }) => theme.spacing.paddingLarge};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.secondary}
  );
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSize.button};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.shadowPrimary} 0 8px 16px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default Button;
