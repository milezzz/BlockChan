export class CreateBoardValidationResult {
    public Success: Boolean;
    public ErrorMessage: string;

    public CreateBoardValidationResult() {
        this.Success = false;
        this.ErrorMessage = '';
    }
}
