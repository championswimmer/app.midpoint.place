<template>
  <BModal v-model="isModalOpen" title="Share Group" size="md" no-footer @hidden="onModalHidden">
    <div class="modal-body-content">
      <p>Share this link with others to invite them to the group:</p>
      <div class="input-group mb-3">
        <input type="text" class="form-control form-control-lg font-monospace" :value="shareUrl" readonly
          ref="shareUrlInput" />
        <BButton variant="outline-secondary" @click="copyToClipboard" title="Copy to Clipboard">
          <CopyIcon :size="20" />
        </BButton>
      </div>
      <div v-if="copySuccessMessage" class="text-success mt-2">{{ copySuccessMessage }}</div>
      <div v-if="copyErrorMessage" class="text-danger mt-2">{{ copyErrorMessage }}</div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <BButton variant="secondary" @click="closeModal">Close</BButton>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import { CopyIcon } from 'lucide-vue-next';

const props = defineProps<{
  isVisible: boolean;
  groupCode: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:isVisible', value: boolean): void;
}>();

const shareUrlInput = ref<HTMLInputElement | null>(null);
const copySuccessMessage = ref<string | null>(null);
const copyErrorMessage = ref<string | null>(null);

const isModalOpen = computed({
  get: () => props.isVisible,
  set: (value) => emit('update:isVisible', value),
});

const shareUrl = computed(() => {
  if (props.groupCode) {
    return `${window.location.origin}/groups/${props.groupCode}`;
  }
  return window.location.href;
});

const copyToClipboard = async () => {
  copySuccessMessage.value = null;
  copyErrorMessage.value = null;
  if (shareUrlInput.value) {
    try {
      shareUrlInput.value.select();
      await navigator.clipboard.writeText(shareUrl.value);
      copySuccessMessage.value = 'Link copied to clipboard!';
      setTimeout(() => (copySuccessMessage.value = null), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      copyErrorMessage.value = 'Failed to copy link. Please copy it manually.';
      setTimeout(() => (copyErrorMessage.value = null), 3000);
    }
  }
};

const closeModal = () => {
  emit('update:isVisible', false);
};

const onModalHidden = () => {
  copySuccessMessage.value = null;
  copyErrorMessage.value = null;
};

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    // Reset messages when modal opens
    copySuccessMessage.value = null;
    copyErrorMessage.value = null;
  }
});
</script>

<style scoped>
.modal-body-content {
  /* Add any specific styling for the modal body here */
}

.form-control-lg.font-monospace {
  font-size: 1.1rem;
  /* Adjust as needed */
}
</style>
